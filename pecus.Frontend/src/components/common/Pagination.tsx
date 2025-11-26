'use client';

import ReactPaginate from 'react-paginate';
import 'react-paginate/theme/basic/react-paginate.css';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (selectedItem: { selected: number }) => void;
  marginPagesDisplayed?: number;
  pageRangeDisplayed?: number;
}

/**
 * 共通Paginationコンポーネント
 * - FlyonUIのjoinスタイルを使用
 * - react-paginateをラップして統一的なスタイルを提供
 */
export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  marginPagesDisplayed = 2,
  pageRangeDisplayed = 5,
}: PaginationProps) {
  // ページ数が1以下の場合は表示しない
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex justify-center mt-6">
      <ReactPaginate
        previousLabel={
          <span className="flex items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            前へ
          </span>
        }
        nextLabel={
          <span className="flex items-center gap-1">
            次へ
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </span>
        }
        breakLabel={'...'}
        pageCount={totalPages}
        marginPagesDisplayed={marginPagesDisplayed}
        pageRangeDisplayed={pageRangeDisplayed}
        onPageChange={onPageChange}
        forcePage={currentPage - 1} // react-paginateは0-based、currentPageは1-based
        containerClassName={'flex gap-0.5'}
        pageClassName={''}
        pageLinkClassName={'btn btn-sm hover:btn-primary transition-colors'}
        previousClassName={''}
        previousLinkClassName={'btn btn-sm hover:btn-primary transition-colors'}
        nextClassName={''}
        nextLinkClassName={'btn btn-sm hover:btn-primary transition-colors'}
        breakClassName={''}
        breakLinkClassName={'btn btn-sm btn-disabled'}
        activeClassName={'btn-primary'}
        disabledClassName={'btn-disabled opacity-50'}
        disabledLinkClassName={'cursor-not-allowed'}
      />
    </div>
  );
}
