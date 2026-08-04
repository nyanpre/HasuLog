// src/components/common/HowToUseModal.tsx
import * as Dialog from '@radix-ui/react-dialog';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export const HowToUseModal = ({ isOpen, onClose }: Props) => {
  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in" />
        
        <Dialog.Content 
          className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl shadow-2xl flex flex-col max-h-[85vh] outline-none"
          aria-describedby={undefined}
        >
          <div className="flex justify-between items-center p-4 border-b border-gray-100">
            <Dialog.Title className="font-bold text-gray-800 text-base">
              HasuLogの使い方
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-gray-500 hover:text-gray-800 transition-colors text-lg px-2">
                ✕
              </button>
            </Dialog.Close>
          </div>

          <div className="overflow-y-auto p-5 custom-scrollbar text-sm text-gray-700 space-y-6">
            
            <section>
              <h3 className="font-bold text-gray-900 border-b border-gray-200 pb-1 mb-2">
                視聴記録のつけ方
              </h3>
              <p className="leading-relaxed">
                動画の詳細画面を開き、「YouTubeで開く」ボタンを押すと自動的に視聴回数が1回追加されます。視聴回数の横にある「＋」「ー」ボタンを使って、手動で回数を調整することも可能です。
              </p>
            </section>

            <section>
              <h3 className="font-bold text-gray-900 border-b border-gray-200 pb-1 mb-2">
                お気に入り機能
              </h3>
              <p className="leading-relaxed">
                詳細画面のタイトルの右側にある「☆」を押すと、「★」に変わりお気に入りとして登録されます。お気に入り登録した動画は、一覧画面のフィルターから簡単に絞り込んで探すことができます。
              </p>
            </section>

            <section>
              <h3 className="font-bold text-gray-900 border-b border-gray-200 pb-1 mb-2">
                視聴メモと公開機能
              </h3>
              <p className="leading-relaxed mb-2">
                動画ごとに自分用のメモを残すことができます。保存する際、以下の公開設定を選ぶことができます。
              </p>
              <ul className="bg-gray-50 p-3 rounded border border-gray-100 space-y-2">
                <li><span className="font-bold text-gray-800">非公開：</span>自分だけが見られます（初期設定）</li>
                <li><span className="font-bold text-gray-800">公開（匿名）：</span>名前を伏せて「みんなのメモ」に表示されます</li>
                <li><span className="font-bold text-gray-800">公開（名前を表示）：</span>あなたの名前と一緒に表示されます</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-gray-900 border-b border-gray-200 pb-1 mb-2">
                今日のおすすめ
              </h3>
              <p className="leading-relaxed mb-2">
                毎日1本の動画を日替わりで自動ピックアップします。
              </p>
              <ul className="bg-gray-50 p-3 rounded border border-gray-100 space-y-2">
                <li><span className="font-bold text-pink-500">デイリースレッド：</span>動画の下にある掲示板で、日々の話題や感想を語り合えます</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-gray-900 border-b border-gray-200 pb-1 mb-2">
                マイページ
              </h3>
              <p className="leading-relaxed mb-2">
                自分の視聴ランクの確認や、プロフィールの設定ができます。
              </p>
              <ul className="bg-gray-50 p-3 rounded border border-gray-100 space-y-2">
                <li><span className="font-bold text-pink-500">推しアピール：</span>お気に入りの推しや配信を自由に登録できます</li>
                <li><span className="font-bold text-pink-500">フレンド登録：</span>自動発行される「フレンドID」を教え合うことで、友達と繋がれます</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-gray-900 border-b border-gray-200 pb-1 mb-2">
                タイムライン
              </h3>
              <p className="leading-relaxed mb-2">
                繋がった友達の最近のアクティビティをチェックできます。
              </p>
              <ul className="bg-gray-50 p-3 rounded border border-gray-100 space-y-2">
                <li><span className="font-bold text-pink-500">視聴履歴の共有：</span>友達が今どんな動画を見ているか覗いてみましょう</li>
              </ul>
            </section>

          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};