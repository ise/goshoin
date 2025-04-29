export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-primary">このサイトについて</h1>
        <p className="text-lg text-gray-600">
          御書印プロジェクトに参加している書店を検索できるサービスです。
        </p>
      </div>

      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold text-primary mb-4">
            サイトの目的
          </h2>
          <p className="text-gray-600">
            御書印プロジェクトに参加している書店を簡単に探せるようにすることで、本屋さんや本の文化そのものを盛り上げることを目指しています。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-primary mb-4">
            データについて
          </h2>
          <p className="text-gray-600">
            このサイトで表示されている書店情報は、
            <a
              className="text-blue-600 hover:underline"
              href="https://note.com/goshoin/n/ndd270b812fb5"
            >
              御書印プロジェクト公式note
            </a>
            の参加店舗データを基に作成されています。データは定期的に更新されます。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-primary mb-4">
            お問い合わせ
          </h2>
          <p className="text-gray-600">
            サイトに関するお問い合わせは、
            <a
              className="text-blue-600 hover:underline"
              href="https://github.com/ise/goshoin/issues"
            >
              GitHubのIssue
            </a>
            でお願いします。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-primary mb-4">免責事項</h2>
          <p className="text-gray-600">
            このサイトは非公式のサービスです。御書印プロジェクトとは無関係です。表示されている情報は参考情報としてご利用ください。
          </p>
        </section>
      </div>
    </div>
  );
}
