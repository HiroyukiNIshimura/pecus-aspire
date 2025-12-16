/**
 * OpenAPI スキーマから 409 Conflict レスポンスの型定義を自動生成
 *
 * このスクリプトは pecus.Frontend/.spec/open-api-scheme.json を解析して、
 * 409 Conflict レスポンスに対応する型情報を抽出し、
 * src/connectors/api/ConflictDataTypes.generated.ts を生成します。
 */

const fs = require('fs');
const path = require('path');

const openApiSpecPath = path.join(__dirname, '../.spec/open-api-scheme.json');
const outputPath = path.join(__dirname, '../src/connectors/api/ConflictDataTypes.generated.ts');

/**
 * OpenAPI定義から409 Conflict対応の型を抽出
 * @param {Object} spec OpenAPI仕様オブジェクト
 * @returns {Map<string, string>} { entityName: 'TypeName' }
 */
function extractConflictTypesFromOpenAPI(spec) {
  const conflictTypes = new Map();

  if (!spec.paths) {
    console.warn('⚠️  No paths found in OpenAPI spec');
    return conflictTypes;
  }

  // すべてのエンドポイントをスキャン
  Object.entries(spec.paths).forEach(([pathName, pathItem]) => {
    // get, post, put, delete, patch等のメソッドをスキャン
    Object.entries(pathItem).forEach(([method, operation]) => {
      if (typeof operation !== 'object' || !operation.responses) {
        return;
      }

      // 409 Conflictレスポンスを探す
      const conflictResponse = operation.responses['409'];
      if (!conflictResponse) {
        return;
      }

      // レスポンスのスキーマを取得
      const schema = conflictResponse.content?.['application/json']?.schema;
      if (!schema) {
        console.warn(`⚠️  No schema found for 409 response at ${method.toUpperCase()} ${pathName}`);
        return;
      }

      // $ref形式の場合（例: "#/components/schemas/OrganizationResponseConcurrencyErrorResponse"）
      if (schema.$ref) {
        const schemaName = schema.$ref.split('/').pop();
        processConcurrencyErrorSchema(schemaName, spec, conflictTypes);
      }
      // allOf形式の場合
      else if (schema.allOf) {
        schema.allOf.forEach(item => {
          if (item.$ref) {
            const schemaName = item.$ref.split('/').pop();
            processConcurrencyErrorSchema(schemaName, spec, conflictTypes);
          }
        });
      }
    });
  });

  return conflictTypes;
}

/**
 * ConcurrencyErrorResponseスキーマを処理して型を抽出
 * @param {string} schemaName スキーマ名（例: "OrganizationResponseConcurrencyErrorResponse"）
 * @param {Object} spec OpenAPI仕様
 * @param {Map} conflictTypes 累積結果
 */
function processConcurrencyErrorSchema(schemaName, spec, conflictTypes) {
  // ConcurrencyErrorResponse スキーマかどうか確認
  if (!schemaName.includes('ConcurrencyErrorResponse')) {
    return;
  }

  const schemaDef = spec.components?.schemas?.[schemaName];
  if (!schemaDef) {
    console.warn(`⚠️  Schema not found: ${schemaName}`);
    return;
  }

  // current フィールドのスキーマを取得
  const currentSchema = schemaDef.properties?.current;
  if (!currentSchema) {
    console.warn(`⚠️  No 'current' field in ${schemaName}`);
    return;
  }

  // current の型を抽出
  let currentTypeName = null;

  if (currentSchema.$ref) {
    // 直接 $ref の場合
    currentTypeName = currentSchema.$ref.split('/').pop();
  } else if (currentSchema.allOf) {
    // allOf 形式の場合、最初の $ref を取得
    const refItem = currentSchema.allOf.find(item => item.$ref);
    if (refItem) {
      currentTypeName = refItem.$ref.split('/').pop();
    }
  } else if (currentSchema.oneOf) {
    // oneOf 形式の場合（nullable 対応）、$ref を含むアイテムを探す
    const refItem = currentSchema.oneOf.find(item => item.$ref);
    if (refItem) {
      currentTypeName = refItem.$ref.split('/').pop();
    }
  }

  if (!currentTypeName) {
    console.warn(`⚠️  Could not extract type from current field in ${schemaName}`);
    return;
  }

  // エンティティ名を推測
  const entityName = inferEntityName(currentTypeName);

  if (entityName) {
    // 既に登録されている場合は、より詳細な型を優先
    if (!conflictTypes.has(entityName) || currentTypeName.includes('Detail')) {
      conflictTypes.set(entityName, currentTypeName);
      console.log(`  ✓ ${entityName}: ${currentTypeName}`);
    }
  }
}

/**
 * 型名からエンティティ名を推測
 *
 * "OrganizationResponse" → "organization"
 * "WorkspaceDetailResponse" → "workspace"
 * "WorkspaceFullDetailResponse" → "workspaceFull"
 * "WorkspaceItemDetailResponse" → "workspaceItem"
 * "TagDetailResponse" → "tag"
 * "SkillDetailResponse" → "skill"
 * "UserDetailResponse" → "user"
 *
 * @param {string} typeName 型名
 * @returns {string|null} エンティティ名（キャメルケース）
 */
function inferEntityName(typeName) {
  // WorkspaceFullDetailResponse は workspaceFull として区別する
  if (typeName === 'WorkspaceFullDetailResponse') {
    return 'workspaceFull';
  }

  // 接尾辞を削除
  let name = typeName
    .replace(/DetailResponse$/, '')
    .replace(/Response$/, '');

  if (!name) {
    return null;
  }

  // キャメルケースの先頭を小文字に（例: "Organization" → "organization"）
  return name.charAt(0).toLowerCase() + name.slice(1);
}

/**
 * 抽出した型から ConflictDataTypes.generated.ts を生成
 * @param {Map<string, string>} conflictTypes エンティティ型のマッピング
 * @returns {string} 生成されたコード
 */
function generateConflictTypesFile(conflictTypes) {
  // インポート文を生成（型名でソート）
  const typeNames = Array.from(conflictTypes.values())
    .filter((value, index, self) => self.indexOf(value) === index) // 重複排除
    .sort();

  const imports = typeNames
    .map(type => `  ${type},`)
    .join('\n');

  // Union型を生成（エンティティ名でソート）
  const unionTypes = Array.from(conflictTypes.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([entityName, typeName]) => {
      return `  | {
      type: '${entityName}';
      data: ${typeName};
    }`;
    })
    .join('\n');

  const code = `/**
 * 409 Conflict レスポンスで返される最新データの型定義
 *
 * この ファイルは scripts/generate-conflict-types.js により自動生成されます。
 * 手動での編集は行わないでください。
 *
 * 更新するには以下を実行してください:
 * \`\`\`
 * npm run generate:conflict-types
 * \`\`\`
 *
 * 元になる OpenAPI 定義:
 * pecus.Frontend/.spec/open-api-scheme.json
 */

import type {
${imports}
} from "./pecus";

/**
 * バックエンド ConcurrencyErrorResponse のボディ形式（409 Conflict）
 *
 * GlobalExceptionFilter が 409 Conflict 時に返すレスポンスボディです。
 * Server Actions で detectConcurrencyError の payload として受け取ります。
 *
 * @example
 * const concurrencyError = detectConcurrencyError(error);
 * if (concurrencyError) {
 *   const current = concurrencyError.payload.current; // 最新のエンティティデータ
 *   const message = concurrencyError.payload.message; // エラーメッセージ
 * }
 */
export type ConcurrencyErrorResponseBody<T = unknown> = {
  statusCode: number;
  message: string;
  current?: T;
};

/**
 * 409 Conflict で返される最新データ（discriminator 型）
 *
 * 各エンティティ型に対応するレスポンスを union 型で定義しています。
 * クライアント側では \`latest.type\` で型を判別し、\`latest.data\` にアクセスできます。
 *
 * @example
 * // switch 文での分岐
 * switch (latest?.type) {
 *   case 'workspace':
 *     console.log(latest.data.id);
 *     break;
 *   case 'tag':
 *     console.log(latest.data.name);
 *     break;
 *   // ...
 * }
 */
export type ConflictLatestData =
${unionTypes};
`;

  return code;
}

/**
 * メイン処理
 */
async function main() {
  try {
    console.log('🔍 OpenAPI スキーマを読み込み中...');

    if (!fs.existsSync(openApiSpecPath)) {
      throw new Error(`OpenAPI スキーマが見つかりません: ${openApiSpecPath}`);
    }

    const openApiSpec = JSON.parse(fs.readFileSync(openApiSpecPath, 'utf-8'));

    console.log('\n📊 409 Conflict レスポンス型を抽出中...');
    const conflictTypes = extractConflictTypesFromOpenAPI(openApiSpec);

    if (conflictTypes.size === 0) {
      console.warn('⚠️  409 Conflict レスポンスが見つかりませんでした');
      process.exit(1);
    }

    console.log(`\n✅ ${conflictTypes.size} 個のエンティティ型を検出:`);
    conflictTypes.forEach((type, entity) => {
      console.log(`   • ${entity}: ${type}`);
    });

    console.log('\n✍️  ファイルを生成中...');
    const code = generateConflictTypesFile(conflictTypes);

    // 出力ディレクトリが存在することを確認
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, code, 'utf-8');

    console.log(`✅ 生成完了: ${outputPath}`);
    console.log(`   ファイルサイズ: ${fs.statSync(outputPath).size} bytes`);

  } catch (error) {
    console.error('❌ エラーが発生しました:');
    console.error(`   ${error.message}`);
    process.exit(1);
  }
}

// スクリプト実行
main();
