"use client";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  // スマホ用のページネーション（前後のページのみ表示）
  const MobilePagination = () => {
    return (
      <div className="flex items-center justify-between w-full">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 text-sm text-accent disabled:text-gray-400"
        >
          ← 前へ
        </button>
        <span className="text-sm text-primary">
          {currentPage} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 text-sm text-accent disabled:text-gray-400"
        >
          次へ →
        </button>
      </div>
    );
  };

  // PC用のページネーション（すべてのページを表示）
  const DesktopPagination = () => {
    return (
      <div className="flex items-center space-x-2">
        {pages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3 py-1 rounded ${
              currentPage === page
                ? "bg-primary text-white"
                : "text-primary hover:bg-accent2"
            }`}
          >
            {page}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="flex justify-center">
      {/* スマホ用（md未満） */}
      <div className="md:hidden w-full">
        <MobilePagination />
      </div>
      {/* PC用（md以上） */}
      <div className="hidden md:block">
        <DesktopPagination />
      </div>
    </div>
  );
}
