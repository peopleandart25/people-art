import Link from "next/link"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-10">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">← 홈으로</Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">개인정보처리방침</h1>
        <p className="text-sm text-gray-500 mb-10">피플앤아트(PEOPLE AND ART) · 최종 업데이트: 2025년 3월</p>

        <div className="bg-white rounded-2xl border border-gray-200 p-8 space-y-8 text-sm text-gray-700 leading-relaxed">
          <p className="text-gray-600">
            피플앤아트(이하 "회사")는 이용자의 개인정보를 중요시하며, 「개인정보 보호법」 및 관계 법령이 정하는 바에 따라 이용자의 개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 다음과 같이 개인정보처리방침을 수립·공개합니다.
          </p>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">제1조 (수집하는 개인정보 항목 및 수집 방법)</h2>
            <div className="space-y-3 text-gray-600">
              <p>회사는 서비스 제공을 위해 아래와 같이 개인정보를 수집합니다.</p>
              <div>
                <p className="font-medium text-gray-700 mb-1">필수 수집 항목</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>이름, 이메일 주소, 휴대폰 번호</li>
                  <li>생년월일, 성별</li>
                  <li>키, 몸무게 (배우 프로필 정보)</li>
                  <li>경력 사항, 자기소개</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-gray-700 mb-1">선택 수집 항목</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>프로필 사진, 포트폴리오 파일, 영상 자료</li>
                  <li>SNS 계정 정보 (인스타그램, 유튜브, 틱톡)</li>
                  <li>학력 정보</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-gray-700 mb-1">수집 방법</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>회원가입 및 온보딩 과정에서 이용자가 직접 입력</li>
                  <li>Google, 카카오 소셜 로그인 연동 시 해당 서비스에서 제공하는 정보</li>
                  <li>서비스 이용 과정에서 자동 생성 (접속 로그, 결제 기록 등)</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">제2조 (개인정보의 수집 및 이용 목적)</h2>
            <div className="space-y-2 text-gray-600">
              <p>회사는 수집한 개인정보를 다음의 목적을 위해 이용합니다.</p>
              <ul className="list-disc list-inside space-y-1">
                <li>회원 가입 및 본인 확인, 회원 관리</li>
                <li>배우 프로필 등록 및 캐스팅 관계자에게의 프로필 정보 제공</li>
                <li>멤버십 서비스 제공 및 결제 처리</li>
                <li>이벤트·오디션 정보 제공 및 지원 처리</li>
                <li>고객 문의 대응 및 공지사항 전달</li>
                <li>서비스 개선을 위한 통계 분석</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">제3조 (개인정보의 보유 및 이용 기간)</h2>
            <div className="space-y-2 text-gray-600">
              <p>
                회사는 이용자의 개인정보를 회원 탈퇴 시까지 보유·이용합니다. 단, 관계 법령에 따라 일정 기간 보존이 필요한 경우 해당 기간 동안 보관합니다.
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>전자상거래 관련 기록: 5년 (전자상거래법)</li>
                <li>소비자 불만 및 분쟁 처리 기록: 3년 (전자상거래법)</li>
                <li>서비스 접속 기록: 3개월 (통신비밀보호법)</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">제4조 (개인정보의 제3자 제공)</h2>
            <div className="space-y-2 text-gray-600">
              <p>
                회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다.
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>이용자가 사전에 동의한 경우</li>
                <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
              </ul>
              <p>
                배우 프로필 정보는 서비스의 특성상 캐스팅 관계자(광고 에이전시, 제작사, 소속사 등)에게 공개될 수 있으며, 이용자는 프로필 등록 시 이에 동의한 것으로 간주합니다.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">제5조 (개인정보 처리 위탁)</h2>
            <div className="space-y-3 text-gray-600">
              <p>회사는 서비스 제공을 위해 아래와 같이 개인정보 처리를 위탁합니다.</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 px-3 py-2 text-left">수탁업체</th>
                      <th className="border border-gray-200 px-3 py-2 text-left">위탁 업무 내용</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-200 px-3 py-2">Supabase Inc.</td>
                      <td className="border border-gray-200 px-3 py-2">회원 인증 및 데이터베이스 관리</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-200 px-3 py-2">포트원(PortOne)</td>
                      <td className="border border-gray-200 px-3 py-2">결제 처리 및 결제 정보 관리</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-200 px-3 py-2">Vercel Inc.</td>
                      <td className="border border-gray-200 px-3 py-2">서비스 인프라 운영</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">제6조 (이용자 권리와 행사 방법)</h2>
            <div className="space-y-2 text-gray-600">
              <p>이용자는 언제든지 다음의 권리를 행사할 수 있습니다.</p>
              <ul className="list-disc list-inside space-y-1">
                <li>개인정보 열람 요청</li>
                <li>개인정보 정정·삭제 요청</li>
                <li>개인정보 처리 정지 요청</li>
                <li>회원 탈퇴 및 개인정보 전체 삭제 요청</li>
              </ul>
              <p>
                위 권리 행사는 마이페이지 내 설정에서 직접 처리하거나, 아래 개인정보 책임자에게 이메일로 요청하실 수 있습니다.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">제7조 (개인정보 보호를 위한 기술적·관리적 대책)</h2>
            <div className="space-y-2 text-gray-600">
              <ul className="list-disc list-inside space-y-1">
                <li>개인정보는 암호화되어 저장 및 전송됩니다.</li>
                <li>비밀번호는 단방향 암호화(해시)되어 관리되며, 회사는 비밀번호를 알 수 없습니다.</li>
                <li>개인정보에 대한 접근 권한을 최소화하여 관리합니다.</li>
                <li>HTTPS를 통해 전송 중 데이터를 암호화합니다.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">제8조 (쿠키 사용)</h2>
            <div className="space-y-2 text-gray-600">
              <p>
                회사는 이용자의 로그인 상태 유지 및 서비스 이용 편의를 위해 쿠키(Cookie)를 사용합니다. 이용자는 브라우저 설정을 통해 쿠키 저장을 거부할 수 있으나, 이 경우 로그인 및 일부 서비스 이용이 제한될 수 있습니다.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">제9조 (개인정보 보호책임자)</h2>
            <div className="space-y-2 text-gray-600">
              <p>회사는 개인정보 처리에 관한 업무를 총괄하고, 개인정보 처리와 관련한 이용자의 불만 처리 및 피해 구제를 위해 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.</p>
              <div className="bg-gray-50 rounded-lg px-4 py-3 space-y-1">
                <p><span className="font-medium">담당자:</span> 피플앤아트 개인정보보호 담당</p>
                <p><span className="font-medium">이메일:</span> privacy@people-art.co.kr</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">제10조 (개인정보 처리방침 변경)</h2>
            <div className="space-y-2 text-gray-600">
              <p>
                이 개인정보처리방침은 법령 또는 서비스의 변경에 따라 내용이 추가·수정될 수 있습니다. 변경 시 서비스 내 공지사항을 통해 사전 안내합니다.
              </p>
              <p className="text-gray-500">시행일: 2025년 3월 1일</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
