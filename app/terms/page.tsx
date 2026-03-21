import Link from "next/link"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-10">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">← 홈으로</Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">이용약관</h1>
        <p className="text-sm text-gray-500 mb-10">피플앤아트(PEOPLE AND ART)</p>

        <div className="bg-white rounded-2xl border border-gray-200 p-8 space-y-8 text-sm text-gray-700 leading-relaxed">
          <p className="text-gray-600">
            본 약관은 피플앤아트(이하 "회사")가 제공하는 모든 서비스의 이용과 관련하여 회사와 이용자 간의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.
          </p>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">제1조 (서비스의 성격)</h2>
            <div className="space-y-2 text-gray-600">
              <p>
                피플앤아트는 배우 및 출연자를 대상으로 광고 에이전시, 제작사, 소속사, 캐스팅 담당자에게 프로필, 자료 및 정보를 전달하고 연결하는 중개형 플랫폼입니다.
              </p>
              <p>
                회사는 매니지먼트, 에이전시, 제작사, 기획사가 아니며, 출연, 캐스팅, 계약, 합격, 수익 발생을 보장하지 않습니다.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">제2조 (회원 가입 및 이용)</h2>
            <ul className="space-y-2 text-gray-600 list-disc list-inside">
              <li>서비스 이용을 위해 회원은 사실에 기반한 정보를 등록해야 합니다.</li>
              <li>허위·부정확한 정보 등록으로 발생한 불이익은 회원 본인의 책임입니다.</li>
              <li>회사는 서비스 운영상 필요한 경우 회원 자격을 제한하거나 해지할 수 있습니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">제3조 (서비스 제공 내용)</h2>
            <p className="text-gray-600 mb-2">회사는 다음과 같은 서비스를 제공합니다.</p>
            <ul className="space-y-2 text-gray-600 list-disc list-inside">
              <li>배우 프로필 및 자료 등록</li>
              <li>광고 에이전시, 제작사, 소속사 등에 대한 이메일 전송 기능</li>
              <li>프로필 투어 및 전달 서비스</li>
              <li>오디션, 특강, 캐스팅 이벤트 정보 제공</li>
              <li>회원 전용방을 통한 정보 제공</li>
            </ul>
            <p className="text-gray-500 mt-2 text-xs">단, 서비스 제공 방식과 범위는 운영 상황에 따라 변경될 수 있습니다.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">제4조 (멤버십 서비스)</h2>
            <div className="space-y-2 text-gray-600">
              <p>
                멤버십 회원은 비회원보다 확장된 기능과 혜택을 이용할 수 있습니다. 단, 모든 혜택은 작품 상황, 캐스팅 기준, 외부 업체 사정에 따라 제한될 수 있습니다.
              </p>
              <p>멤버십 가입은 캐스팅이나 출연을 보장하지 않습니다.</p>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">제5조 (이메일 전송 및 전달 서비스)</h2>
            <div className="space-y-2 text-gray-600">
              <p>
                회사는 회원의 요청에 따라 회원이 등록한 자료를 광고 에이전시, 제작사, 소속사 등에 전달하는 역할을 수행합니다.
              </p>
              <p>
                회사는 해당 수신자의 응답, 검토, 연락, 캐스팅 여부에 대해 어떠한 법적 책임도 지지 않습니다.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">제6조 (오디션 및 이벤트)</h2>
            <div className="space-y-2 text-gray-600">
              <p>오디션, 특강, 캐스팅 이벤트는 작품별, 캐스팅 기준에 따라 선별적으로 제공됩니다.</p>
              <p>
                모든 회원에게 동일하게 제공되지 않을 수 있으며, 참여 또는 배정되지 않았다는 사유만으로 환불이나 손해배상을 청구할 수 없습니다.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">제7조 (요금 및 결제)</h2>
            <p className="text-gray-600">
              서비스 이용 요금은 홈페이지에 고지된 금액을 기준으로 합니다. 회사는 필요 시 요금을 변경할 수 있으며, 변경 내용은 사전에 공지합니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">제8조 (환불 및 취소)</h2>
            <p className="text-gray-600">
              환불 및 취소는 회사가 별도로 고지한{" "}
              <Link href="/refund" className="text-orange-500 hover:underline">환불 정책</Link>에 따릅니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">제9조 (책임의 한계)</h2>
            <p className="text-gray-600 mb-2">회사는 다음 사항에 대해 책임을 지지 않습니다.</p>
            <ul className="space-y-2 text-gray-600 list-disc list-inside">
              <li>캐스팅, 출연, 계약, 수익 발생의 결과</li>
              <li>외부 제작사, 에이전시, 캐스팅 담당자의 판단 및 결정</li>
              <li>회원 간 또는 회원과 제3자 간의 분쟁</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">제10조 (서비스 중단)</h2>
            <p className="text-gray-600">
              회사는 시스템 점검, 서버 장애, 외부 환경 등으로 인해 서비스 제공이 일시 중단될 수 있으며, 이에 대한 손해에 대해 책임지지 않습니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">제11조 (약관 변경)</h2>
            <p className="text-gray-600">
              회사는 약관을 변경할 수 있으며, 변경 시 홈페이지 또는 공지사항을 통해 사전 고지합니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">제12조 (준거법 및 관할)</h2>
            <p className="text-gray-600">
              본 약관은 대한민국 법을 따르며, 회사와 회원 간 분쟁은 회사 본점 소재지를 관할하는 법원을 전속 관할로 합니다.
            </p>
          </section>

          <div className="pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              사업자: 피플앤아트(PEOPLE AND ART) · 대표: 김슬기 · 사업자등록번호: 350-01-02292
            </p>
            <p className="text-xs text-gray-400 mt-1">
              문의: peopleandart25@gmail.com
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
