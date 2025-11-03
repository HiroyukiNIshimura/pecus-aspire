import { useRef } from 'react';
import ConfirmDeleteModal, { ConfirmDeleteModalRef } from '@/components/common/ConfirmDeleteModal';

export default function ExampleComponent() {
  const modalRef = useRef<ConfirmDeleteModalRef>(null);

  const handleDelete = () => {
    // 削除処理
    console.log('アイテムを削除しました');
  };

  const handleCancel = () => {
    console.log('削除をキャンセルしました');
  };

  return (
    <div>
      <button
        type="button"
        className="btn btn-error"
        onClick={() => modalRef.current?.open()}
      >
        削除
      </button>

      <ConfirmDeleteModal
        ref={modalRef}
        title="アイテムの削除"
        message="このアイテムを削除すると、元に戻すことはできません。よろしいですか？"
        confirmText="削除する"
        cancelText="キャンセル"
        onConfirm={handleDelete}
        onCancel={handleCancel}
      />
    </div>
  );
}