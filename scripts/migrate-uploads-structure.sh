#!/bin/sh
# uploads/[orgId] → uploads/organizations/[orgId] への移行スクリプト
# 使用方法: ./scripts/migrate-uploads-structure.sh /path/to/uploads

set -e

UPLOADS_PATH="${1:-./uploads}"

if [ ! -d "$UPLOADS_PATH" ]; then
    echo "Error: uploads directory not found: $UPLOADS_PATH"
    exit 1
fi

ORGANIZATIONS_PATH="$UPLOADS_PATH/organizations"

# organizations フォルダを作成
if [ ! -d "$ORGANIZATIONS_PATH" ]; then
    mkdir -p "$ORGANIZATIONS_PATH"
    echo "Created: $ORGANIZATIONS_PATH"
fi

# 数値IDのフォルダを organizations/ 配下に移動
for dir in "$UPLOADS_PATH"/*/; do
    dirname=$(basename "$dir")

    # workspaces, temp, organizations はスキップ
    case "$dirname" in
        workspaces|temp|organizations)
            echo "Skipping: $dirname"
            continue
            ;;
    esac

    # 数値のみのフォルダ名かチェック（POSIX準拠）
    case "$dirname" in
        ''|*[!0-9]*)
            echo "Skipping non-numeric folder: $dirname"
            continue
            ;;
    esac

    # 移動先が存在しない場合のみ移動
    dest="$ORGANIZATIONS_PATH/$dirname"
    if [ -d "$dest" ]; then
        echo "Warning: destination already exists, skipping: $dest"
    else
        mv "$dir" "$dest"
        echo "Moved: $dir -> $dest"
    fi
done

echo ""
echo "Migration completed!"
echo ""
echo "New structure:"
echo "  uploads/"
echo "    ├── organizations/"
echo "    │   └── [orgId]/"
echo "    │       ├── avatar/[userId]/"
echo "    │       └── genre/[genreId]/"
echo "    ├── workspaces/"
echo "    │   └── [workspaceId]/items/[itemId]/"
echo "    └── temp/"
