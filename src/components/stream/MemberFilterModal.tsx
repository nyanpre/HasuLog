// src/components/stream/MemberFilterModal.tsx
import * as Dialog from '@radix-ui/react-dialog';

export type FilterState = "none" | "include" | "exclude";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  members: string[];
  memberFilters: Record<string, FilterState>;
  setMemberFilter: (member: string, state: FilterState) => void;
  resetMemberFilters: () => void;
  onSetAllExclude?: () => void; // 🌟 全員未出演ハンドラー
};

export const MemberFilterModal = ({
  isOpen,
  onClose,
  members,
  memberFilters,
  setMemberFilter,
  resetMemberFilters,
  onSetAllExclude,
}: Props) => {
  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-xs animate-fade-in" />
        <Dialog.Content 
          className="fixed z-[60] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-xl w-[calc(100%-2rem)] sm:w-full max-w-sm flex flex-col animate-fade-in max-h-[85vh] outline-none"
          aria-describedby={undefined}
        >
          <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50 rounded-t-xl">
            <Dialog.Title className="font-bold text-gray-800 text-sm flex items-center">
              <span className="bg-blue-500 text-white px-2 py-1 rounded-md mr-2 text-xs">出演者</span>
              絞り込み
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-gray-500 hover:text-gray-800 text-lg">✕</button>
            </Dialog.Close>
          </div>
          
          <div className="overflow-y-auto p-2 sm:p-4 custom-scrollbar bg-white">
            <div className="flex flex-col">
              {members.map((member) => (
                <div key={member} className="flex justify-between items-center py-2.5 px-2 border-b border-gray-100 last:border-0 hover:bg-gray-50 rounded-md transition-colors">
                  <span className="text-sm text-gray-700 font-medium whitespace-nowrap mr-2">
                    {member}
                  </span>
                  <div className="flex items-center gap-3 sm:gap-4 text-xs">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input 
                        type="radio" 
                        checked={memberFilters[member] === "none"} 
                        onChange={() => setMemberFilter(member, "none")} 
                        className="text-blue-500 focus:ring-blue-400 w-3.5 h-3.5 sm:w-4 sm:h-4" 
                      />
                      <span className={memberFilters[member] === "none" ? "text-gray-800 font-medium" : "text-gray-500"}>指定なし</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input 
                        type="radio" 
                        checked={memberFilters[member] === "include"} 
                        onChange={() => setMemberFilter(member, "include")} 
                        className="text-blue-500 focus:ring-blue-400 w-3.5 h-3.5 sm:w-4 sm:h-4" 
                      />
                      <span className={memberFilters[member] === "include" ? "text-gray-800 font-medium" : "text-gray-500"}>出演</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input 
                        type="radio" 
                        checked={memberFilters[member] === "exclude"} 
                        onChange={() => setMemberFilter(member, "exclude")} 
                        className="text-red-500 focus:ring-red-400 w-3.5 h-3.5 sm:w-4 sm:h-4" 
                      />
                      <span className={memberFilters[member] === "exclude" ? "text-red-600 font-medium" : "text-gray-500"}>未出演</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 sm:p-4 border-t border-gray-100 bg-white rounded-b-xl flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {/* 🌟 全員未出演ボタン */}
              {onSetAllExclude && (
                <button 
                  type="button"
                  onClick={onSetAllExclude}
                  className="px-2.5 sm:px-3 py-2 text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors whitespace-nowrap"
                >
                  全員未出演
                </button>
              )}

              {/* リセットボタン */}
              <button 
                type="button"
                onClick={resetMemberFilters}
                className="px-2.5 sm:px-3 py-2 text-xs font-bold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors whitespace-nowrap"
              >
                リセット
              </button>
            </div>

            <Dialog.Close asChild>
              <button className="flex-1 max-w-[120px] px-4 py-2 text-xs sm:text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-xs transition-colors">
                完了
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};