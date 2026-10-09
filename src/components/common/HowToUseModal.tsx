// src/components/common/HowToUseModal.tsx
import * as Dialog from '@radix-ui/react-dialog';
import { 
  ChevronDown, 
  BookOpen, 
  Info, 
  PlaySquare, 
  FileText, 
  Sparkles, 
  Archive, 
  User, 
  Gamepad2, 
  Dices
} from 'lucide-react';

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
          className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-gray-50 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] outline-none border border-gray-200 overflow-hidden"
          aria-describedby={undefined}
        >
          {/* 🌟 位置移動なし・4秒かけて不透明度のみをフェードイン */}
          <style>{`
            @keyframes pureFadeIn {
              0% {
                opacity: 0;
              }
              100% {
                opacity: 1;
              }
            }
            .animate-pure-fade-in {
              animation: pureFadeIn 4s cubic-bezier(0.25, 1, 0.5, 1) forwards;
            }
          `}</style>

          {/* ヘッダー */}
          <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200 bg-white">
            <Dialog.Title className="font-bold text-gray-800 text-sm flex items-center gap-2">
              <BookOpen size={16} className="text-gray-600" />
              <span>HasuLog 使い方ガイド</span>
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-gray-400 hover:text-gray-700 transition-colors text-base px-2 font-bold cursor-pointer">
                ✕
              </button>
            </Dialog.Close>
          </div>

          {/* スクロール可能領域 */}
          <div className="overflow-y-auto custom-scrollbar">
            
            {/* 🌟 ファーストビュー：公式ストーリーイントロ再現エリア */}
            <div className="min-h-[85vh] flex flex-col justify-between items-center text-center px-6 sm:px-10 py-14 sm:py-16 bg-[#F8F7F2] border-b border-gray-200/80 select-none">
              <div className="my-auto space-y-8 animate-pure-fade-in">
                
                {/* 見出し：HasuLog & 飾り線 */}
                <div className="flex flex-col items-center">
                  <h2 className="font-serif text-3xl sm:text-4xl text-[#1a1a1a] tracking-[0.18em] uppercase font-light">
                    HasuLog
                  </h2>
                  <div className="w-12 sm:w-16 h-[1px] bg-[#333333] mt-4 mb-2 opacity-80" />
                </div>

                {/* 本文：Noto Sans CJK JP (#000000) */}
                <div 
                  className="space-y-6 text-sm sm:text-base text-[#000000] leading-[2.3] sm:leading-[2.5] tracking-[0.06em] font-normal"
                  style={{ fontFamily: '"Noto Sans CJK JP", "Noto Sans JP", sans-serif' }}
                >
                  <p>
                    石川県金沢市から奥まった場所で、<br />
                    蓮の花の咲く湖の傍らにある私立蓮ノ空女学院。<br />
                    創立100年を越えるこの高校では、<br />
                    古くから引き継がれた伝統がいまも息づいている。
                  </p>

                  <p>
                    変わらない想いと、移り行く季節。<br />
                    駆け抜けた日々と、ここに遺された足跡。<br />
                    きらめく青春を生きる彼女たちに、<br />
                    いつだって会いに行けるように。<br />
                    いつか色づく透明を見逃さないように。<br />
                    限りある時間を超えて、<br />
                    精一杯に花咲いたあの日々を胸に
                  </p>

                  {/* 🌟 指定サイズ 0.925rem に調整 */}
                  <p className="text-pink-600 font-bold text-[0.925rem] pt-2 tracking-[0.08em] leading-relaxed">
                    「いま」を共にする、あなたのための記録──
                  </p>
                </div>
              </div>

              {/* 下スクロール誘導 */}
              <div className="pt-8 flex flex-col items-center gap-1.5 text-[11px] font-bold text-gray-400 select-none animate-bounce">
                <span className="tracking-widest font-mono">SCROLL</span>
                <ChevronDown size={14} />
              </div>
            </div>

            {/* 🌟 使い方本文エリア */}
            <div className="p-4 sm:p-5 text-sm text-gray-700 space-y-4">
              
              {/* 1. ログインとゲスト利用について */}
              <section className="bg-white border border-blue-200 rounded-xl p-4 shadow-2xs">
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-blue-100">
                  <Info size={16} className="text-gray-600" />
                  <h3 className="font-bold text-blue-950 text-sm sm:text-base">
                    ログインとゲスト利用について
                  </h3>
                </div>
                <p className="mb-3 text-blue-900/80 text-xs sm:text-sm leading-relaxed">
                  HasuLogは未ログイン（ゲスト）のままでも閲覧可能ですが、一部機能に違いがあります。
                </p>
                <div className="overflow-x-auto rounded-lg border border-blue-100 bg-white">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-blue-50 text-blue-900 border-b border-blue-100">
                        <th className="p-2.5 font-bold">機能</th>
                        <th className="p-2.5 font-bold text-center">ゲスト</th>
                        <th className="p-2.5 font-bold text-center">ログイン中</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-blue-50">
                      <tr>
                        <td className="p-2.5">動画の検索・再生</td>
                        <td className="p-2.5 text-center text-emerald-600 font-bold">〇</td>
                        <td className="p-2.5 text-center text-emerald-600 font-bold">〇</td>
                      </tr>
                      <tr className="bg-blue-50/20">
                        <td className="p-2.5">関連コンテンツの閲覧</td>
                        <td className="p-2.5 text-center text-emerald-600 font-bold">〇</td>
                        <td className="p-2.5 text-center text-emerald-600 font-bold">〇</td>
                      </tr>
                      <tr>
                        <td className="p-2.5">ランダム動画Picker</td>
                        <td className="p-2.5 text-center text-emerald-600 font-bold">〇</td>
                        <td className="p-2.5 text-center text-emerald-600 font-bold">〇</td>
                      </tr>
                      <tr className="bg-blue-50/20">
                        <td className="p-2.5">みんなのメモ閲覧</td>
                        <td className="p-2.5 text-center text-emerald-600 font-bold">〇</td>
                        <td className="p-2.5 text-center text-emerald-600 font-bold">〇</td>
                      </tr>
                      <tr>
                        <td className="p-2.5">ミニゲームのプレイ</td>
                        <td className="p-2.5 text-center text-emerald-600 font-bold">〇</td>
                        <td className="p-2.5 text-center text-emerald-600 font-bold">〇</td>
                      </tr>
                      <tr className="bg-blue-50/20">
                        <td className="p-2.5">今日のおすすめ閲覧</td>
                        <td className="p-2.5 text-center text-gray-300 font-bold">✕</td>
                        <td className="p-2.5 text-center text-emerald-600 font-bold">〇</td>
                      </tr>
                      <tr>
                        <td className="p-2.5">記録・お気に入り・メモ保存</td>
                        <td className="p-2.5 text-center text-gray-300 font-bold">✕</td>
                        <td className="p-2.5 text-center text-emerald-600 font-bold">〇</td>
                      </tr>
                      <tr className="bg-blue-50/20">
                        <td className="p-2.5">マイページ・アクティビティ・フレンド</td>
                        <td className="p-2.5 text-center text-gray-300 font-bold">✕</td>
                        <td className="p-2.5 text-center text-emerald-600 font-bold">〇</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* 2. 視聴記録とお気に入り */}
              <section className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <PlaySquare size={16} className="text-gray-600" />
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                    視聴記録とお気に入り
                  </h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2.5">
                    <span className="bg-gray-100 border border-gray-200 text-gray-700 px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap mt-0.5">記録</span>
                    <p className="text-xs sm:text-sm leading-relaxed text-gray-600">
                      詳細画面の<strong className="text-red-600">「YouTubeで開く」</strong>ボタンを押すと自動で視聴回数が1回追加されます。一覧や詳細画面の<strong className="text-gray-800 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 font-mono">＋ / ー</strong>ボタンで手動調整も可能です。
                    </p>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="bg-gray-100 border border-gray-200 text-gray-700 px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap mt-0.5">お気に入り</span>
                    <p className="text-xs sm:text-sm leading-relaxed text-gray-600">
                      詳細画面右上の星マークを押すとお気に入り登録されます。一覧のフィルターで素早く絞り込めます。
                    </p>
                  </li>
                </ul>
              </section>

              {/* 3. 視聴メモと公開設定 */}
              <section className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <FileText size={16} className="text-gray-600" />
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                    視聴メモと公開設定
                  </h3>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed text-gray-600">
                  動画ごとに自分用の感想やタイムスタンプを保存できます。保存時に3つの公開範囲を選択可能です。
                </p>
                <div className="grid gap-2 sm:grid-cols-3 pt-1">
                  <div className="bg-gray-50 border border-gray-200 p-2.5 rounded-lg text-center">
                    <div className="font-bold text-gray-700 text-xs sm:text-sm mb-0.5">非公開</div>
                    <div className="text-[11px] text-gray-500">自分だけが閲覧可能</div>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg text-center">
                    <div className="font-bold text-emerald-800 text-xs sm:text-sm mb-0.5">公開 (匿名)</div>
                    <div className="text-[11px] text-emerald-700">名前を伏せて全体共有</div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-lg text-center">
                    <div className="font-bold text-blue-800 text-xs sm:text-sm mb-0.5">公開 (記名)</div>
                    <div className="text-[11px] text-blue-700">ユーザー名と共に全体共有</div>
                  </div>
                </div>
              </section>

              {/* 4. 今日のおすすめとランダム動画Picker */}
              <section className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <Sparkles size={16} className="text-gray-600" />
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                    おすすめとランダム動画Picker
                  </h3>
                </div>
                <div className="space-y-3 text-xs sm:text-sm text-gray-600 leading-relaxed">
                  <div>
                    <strong className="text-gray-800">今日のおすすめ</strong>
                    <p className="mt-0.5">
                      ログイン中のユーザー向けに、毎日1本の動画が日替わりで自動選出されます（全動画が1巡するまで被りません）。動画下部のデイリースレッドで感想を投稿して交流できます。
                    </p>
                  </div>
                  <div className="pt-1 border-t border-gray-100">
                    <div className="flex items-center gap-1.5 font-bold text-gray-800 mb-1">
                      <Dices size={15} className="text-gray-600" />
                      <span>ランダム動画Picker</span>
                    </div>
                    <p>
                      対象に含めたい期やカテゴリ（With×MEETS、活動記録、Fes×LIVE、みらくらマイクラ、せーはす、みらぱラジオ）を選んで「動画を引く」を押すと、条件に合った動画がランダムで1本選出されます。ログイン有無にかかわらず利用可能で、何を観るか迷ったときの動画選びに便利です。
                    </p>
                  </div>
                </div>
              </section>

              {/* 5. 関連コンテンツ */}
              <section className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs space-y-2.5">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <Archive size={16} className="text-gray-600" />
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                    関連コンテンツ
                  </h3>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed text-gray-600">
                  メインの配信や活動記録だけでなく、蓮ノ空に関連する各種公式動画アーカイブをログイン有無にかかわらずいつでも閲覧・検索できます。
                </p>
                <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 pt-1">
                  <div className="bg-gray-50 border border-gray-200 p-2.5 rounded-lg">
                    <div className="font-bold text-gray-800 text-xs sm:text-sm">自己紹介動画</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">メンバー・キャストの自己紹介アーカイブ</div>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 p-2.5 rounded-lg">
                    <div className="font-bold text-gray-800 text-xs sm:text-sm">みらぱラジオ</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">待機室・補習室・進路相談室など公式ラジオ</div>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 p-2.5 rounded-lg">
                    <div className="font-bold text-gray-800 text-xs sm:text-sm">せーので！はすのそら！</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">公式YouTube番組アーカイブ</div>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 p-2.5 rounded-lg">
                    <div className="font-bold text-gray-800 text-xs sm:text-sm">メンバーシップ限定動画</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">公式YouTubeメンバーシップ限定動画アーカイブ</div>
                  </div>
                </div>
              </section>

              {/* 6. マイページとアクティビティ */}
              <section className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <User size={16} className="text-gray-600" />
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                    マイページとアクティビティ
                  </h3>
                </div>
                <ul className="space-y-3 text-xs sm:text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold mt-0.5">•</span>
                    <div>
                      <strong className="text-gray-800">アクティビティ・統計の確認</strong>
                      <p className="mt-0.5 leading-relaxed">
                        累計獲得ポイントや現在のランク表示に加え、<strong>過去1年間の視聴履歴（草グラフ）</strong>や<strong>月別獲得ポイント推移グラフ</strong>、直近の視聴記録・メモ更新履歴を一覧で確認できます。
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold mt-0.5">•</span>
                    <div>
                      <strong className="text-gray-800">プロフィールのカスタマイズ</strong>
                      <p className="mt-0.5 leading-relaxed">
                        推しメンバーや一番好きな配信（With×MEETS / Fes×LIVE 等）を設定し、プロフィールカードを充実させることができます。
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold mt-0.5">•</span>
                    <div>
                      <strong className="text-gray-800">フレンド登録とタイムライン</strong>
                      <p className="mt-0.5 leading-relaxed">
                        発行されたフレンドIDを相互登録することで、友達の視聴記録やメモ更新がタイムライン上にリアルタイムで届きます。
                      </p>
                    </div>
                  </li>
                </ul>
              </section>

              {/* 7. ミニゲーム（最下部） */}
              <section className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs space-y-2.5">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <Gamepad2 size={16} className="text-gray-600" />
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                    ミニゲーム（時系列ソート）
                  </h3>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed text-gray-600">
                  画面右上の「ゲーム」から遊べるソートゲームです。ランダムに選ばれた5本の出来事（活動記録・With×MEETS・Fes×LIVE）を、過去から未来（上から下）へ順番に並べ替えて正解を目指します。
                </p>
                <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg text-xs sm:text-sm text-gray-600 leading-relaxed space-y-1">
                  <p>
                    ・期（103期 / 104期 / 105期）や種別の絞り込みに対応しています。
                  </p>
                  <p>
                    ・「数字マスク」や「タイトル非表示」をONにすることで、サムネイルや日付の記憶だけを頼りにする難易度アップ設定も楽しめます。
                  </p>
                </div>
              </section>

            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};