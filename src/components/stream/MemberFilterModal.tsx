// src/components/stream/MemberFilterModal.tsx

export type FilterState = "none" | "include" | "exclude";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  members: string[];
  memberFilters: Record<string, FilterState>;
  setMemberFilter: (member: string, state: FilterState) => void;
  resetMemberFilters: () => void;
};

export const MemberFilterModal = ({ isOpen, onClose, members, memberFilters, setMemberFilter, resetMemberFilters }: Props) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex justify-center items-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm flex flex-col animate-fade-in max-h-[85vh]">
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50 rounded-t-xl">
          <h3 className="font-bold text-gray-800 text-sm flex items-center">
            <span className="bg-blue-500 text-white px-2 py-1 rounded-md mr-2 text-xs">出演者</span>
            絞り込み
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-lg">✕</button>
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
                      className="text-blue-500 focus:ring-blue-400 w-3.5 h-3.5 sm:w-4 sm:h-4" 
                    />
                    <span className={memberFilters[member] === "exclude" ? "text-gray-800 font-medium" : "text-gray-500"}>未出演</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 bg-white rounded-b-xl flex justify-between gap-3">
          <button 
            onClick={resetMemberFilters}
            className="px-4 py-2 text-xs font-bold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            リセット
          </button>
          <button 
            onClick={onClose}
            className="flex-grow px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
          >
            完了
          </button>
        </div>
      </div>
    </div>
  );
};