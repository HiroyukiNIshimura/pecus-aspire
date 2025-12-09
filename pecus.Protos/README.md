# pecus.Protos

gRPCサービス間通信のためのProtocol Buffers定義ファイル格納ディレクトリ。

## 構成

```
pecus.Protos/
├── README.md
└── lexical/
    └── lexical.proto    # LexicalConverterService 用
```

## 使用方法

### C# (.NET) 側

`pecus.WebApi` で gRPC クライアントとして使用:

```xml
<!-- pecus.WebApi.csproj -->
<ItemGroup>
  <Protobuf Include="../pecus.Protos/lexical/lexical.proto" GrpcServices="Client" />
</ItemGroup>
```

### Node.js 側

`pecus.LexicalConverterService` で gRPC サーバーとして使用:

```bash
# proto ファイルを参照（シンボリックリンクまたはコピー）
ln -s ../../pecus.Protos/lexical/lexical.proto proto/lexical.proto
```

## Proto定義ルール

C# ↔ Node.js 間の型インピーダンスミスマッチを避けるため、以下のルールを遵守:

1. **`int64` / `uint64` は使用禁止** → `string` または `int32` を使用
2. **Enum は 0 番目を `UNSPECIFIED` に** → 未設定時のデフォルト値
3. **Optional フィールドは明示的に `optional` を付ける**
4. **日付・時刻は `google.protobuf.Timestamp` を使用**

詳細は [docs/lexical-grpc-service.md](../docs/lexical-grpc-service.md) を参照。
