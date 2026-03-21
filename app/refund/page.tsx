import Link from "next/link"

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-10">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">← 홈으로</Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">환불 정책</h1>
        <p className="text-sm text-gray-500 mb-10">피플앤아트(PEOPLE AND ART)</p>

        <div className="bg-white rounded-2xl border border-gray-200 p-8 space-y-8 text-sm text-gray-700 leading-relaxed">
          <p className="text-gray-600">
            피플앤아트(이하 "회사")는 「전자상거래 등에서의 소비자보호에 관한 법률」 및 「소비자분쟁해결기준」을 준수하여 다음과 같이 환불 및 취소 규정을 운영합니다.
          </p>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">1. 기본 환불 원칙</h2>
            <div className="space-y-2 text-gray-600">
              <p>회원은 결제일로부터 5일 이내에 환불을 요청할 수 있습니다.</p>
              <p>단, 아래 제2조에 해당하는 경우에는 환불이 제한됩니다.</p>
              <p>
                환불 요청은 반드시 상담센터 또는 공식 문의 채널을 통해 접수되어야 하며, 접수 시점 기준으로 환불 가능 여부가 판단됩니다.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">2. 환불이 제한되는 경우</h2>
            <p className="text-gray-600 mb-3">
              다음 중 하나라도 해당될 경우, 해당 서비스는 이미 제공된 것으로 간주되며 환불이 불가합니다.
            </p>
            <ul className="space-y-2 text-gray-600 list-disc list-inside">
              <li>프로필 투어가 진행되었거나, 전달·영업·발송 이력이 있는 경우</li>
              <li>광고 에이전시, 제작사, 소속사 등으로 메일 전송이 이루어진 경우</li>
              <li>오디션, 특강, 캐스팅 이벤트 등에 배정되었거나 참여한 경우</li>
              <li>회원 전용방을 통해 작품 정보, 영업 자료, 인증 자료를 열람한 경우</li>
              <li>포인트, 제휴 혜택, 쿠폰 등을 사용한 경우</li>
            </ul>
            <p className="mt-3 text-xs text-gray-500 bg-gray-50 rounded-lg p-3 border border-gray-100">
              ※ 위 항목은 실제 참여 여부와 관계없이 배정·전달·접속·열람 이력만으로도 서비스 제공으로 판단됩니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">3. 부분 사용 시 환불</h2>
            <div className="space-y-2 text-gray-600">
              <p>
                멤버십 또는 서비스 일부만 이용한 경우에도 이용 이력이 존재하면 환불은 불가합니다.
              </p>
              <p className="text-xs text-gray-500">(전자상거래법상 '디지털 콘텐츠 및 용역 제공 개시'에 해당)</p>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">4. 환불 처리 방식</h2>
            <div className="space-y-2 text-gray-600">
              <p>환불이 승인된 경우, 결제 수단과 동일한 방식으로 환불 처리됩니다.</p>
              <p>
                PG사(카드사·결제대행사) 정책에 따라 실제 환불 완료까지 영업일 기준 3~7일이 소요될 수 있습니다.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">5. 이용자 귀책 사유</h2>
            <p className="text-gray-600 mb-2">다음 사유로 발생한 문제에 대해서는 환불이 불가합니다.</p>
            <ul className="space-y-2 text-gray-600 list-disc list-inside">
              <li>허위 또는 부정확한 프로필 정보 기재</li>
              <li>연락 두절, 자료 미제출, 노쇼</li>
              <li>운영진 및 캐스팅 담당자의 안내 미이행</li>
              <li>회원 본인의 단순 변심 또는 기대와의 차이</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">6. 서비스 성격에 대한 고지</h2>
            <div className="space-y-2 text-gray-600">
              <p>
                피플앤아트는 배우와 제작사·에이전시·캐스팅 담당자 간의 프로필 전달 및 연결을 중개하는 서비스로, 오디션 합격, 캐스팅, 계약, 출연을 보장하지 않습니다.
              </p>
              <p>이에 따른 결과 미발생은 환불 사유에 해당하지 않습니다.</p>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">7. 환불 문의</h2>
            <p className="text-gray-600 mb-3">환불 및 이용 취소 관련 문의는 아래로 접수해 주세요.</p>
            <div className="bg-orange-50 rounded-xl p-4 space-y-1">
              <p className="text-sm font-medium text-orange-800">상담센터</p>
              <p className="text-sm text-orange-700">📧 peopleandart25@gmail.com</p>
            </div>
          </section>

          <div className="pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              사업자: 피플앤아트(PEOPLE AND ART) · 대표: 김슬기 · 사업자등록번호: 350-01-02292
            </p>
            <p className="text-xs text-gray-400 mt-1">
              주소: 서울특별시 성북구 동소문로 20길 29-11, 4층(동선동 1가, 반석빌딩)
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
