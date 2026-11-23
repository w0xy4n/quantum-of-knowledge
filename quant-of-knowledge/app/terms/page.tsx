import Link from "next/link";
import { CopyEmailButton } from "@/components/copy-email-button";
import { proSection } from "@/lib/pro";

/**
 * Terms of use.
 *
 * Everything here is true of Evermind as it stands in this repository: a
 * planner you can use, self-host or fork, with no charge and nothing sold. If
 * the optional module is installed, it adds the section describing what is sold
 * and on what terms — which is why that section is not written here, where it
 * would be false for every self-hosted instance.
 */

const CONTACT_ADDRESS = "data@evermind.today";
const CONTACT_LABEL = "data [at] evermind (dot) today";

export default function TermsPage() {
  const PurchaseTerms = proSection("terms-purchase");

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold mb-6">Условия использования</h1>

      {/*
        Deliberately loud, and deliberately not removed by whoever drafted it.
        These terms are written to describe what the software actually does,
        which is not the same as being sufficient. Anyone running an instance
        that takes money should have them reviewed by someone qualified before
        it does.
      */}
      <div className="mb-8 rounded-lg border border-amber-500/50 bg-amber-50 dark:bg-amber-950/30 p-4">
        <p className="text-sm text-amber-900 dark:text-amber-200">
          <strong>Примечание для владельца сервиса — это не юридическая консультация.</strong> Этот документ написан,
          чтобы точно описать, как работает Квант-знаний. Его не проверял юрист. Если вы запускаете свой экземпляр
          сервиса — тем более платный — покажите эти условия специалисту и замените эту плашку, прежде чем на них
          полагаться.
        </p>
      </div>

      <div className="space-y-6 text-gray-700 dark:text-gray-300">
        <section>
          <h2 className="text-2xl font-semibold mb-3">Что такое Квант-знаний</h2>
          <p>
            Квант-знаний — это планировщик учебных заданий: вы записываете задания, их сроки сдачи и предметы, а сервис
            показывает, что приближается. Он предоставляется «как есть», для личного использования. Сервис не связан ни
            с одной школой, колледжем или вузом и не является официальным источником — сроки, объявленные вашим учебным
            заведением, имеют приоритет.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Ваш аккаунт</h2>
          <p>
            Для использования сервиса нужен аккаунт, и вы отвечаете за всё, что происходит под ним. Храните данные для
            входа в безопасности и сообщите нам, если считаете, что аккаунтом воспользовался кто-то другой. Вы должны
            достигнуть возраста, позволяющего принять эти условия по законам вашей страны; если нет — условия должен
            принять родитель или опекун.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Ваши данные принадлежат вам</h2>
          <p>
            Задания и предметы, которые вы вносите в Квант-знаний, принадлежат вам. Мы не заявляем на них никаких прав и
            не продаём их. Вы можете в любой момент выгрузить всё или удалить аккаунт на{" "}
            <Link href="/settings" className="underline decoration-solid hover:opacity-70 transition-opacity">
              странице настроек
            </Link>
            . Удаление происходит сразу и безвозвратно, поэтому если нужна копия — сначала выгрузите данные. Как мы
            обращаемся с данными, описано в нашей{" "}
            <Link href="/privacy" className="underline decoration-solid hover:opacity-70 transition-opacity">
              Политике конфиденциальности
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Допустимое использование</h2>
          <p className="mb-2">Пожалуйста, не:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>используйте сервис для хранения или распространения чего-либо противозаконного;</li>
            <li>пытайтесь получить доступ к чужому аккаунту или данным;</li>
            <li>проверяйте на прочность, перегружайте или нарушайте работу сервиса и его инфраструктуры;</li>
            <li>используйте автоматические средства, создающие нагрузку сверх обычного личного использования.</li>
          </ul>
          <p className="mt-2">
            Мы можем приостановить аккаунт, который делает что-то из этого, и, где это разумно возможно, объясним
            почему.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Открытый исходный код</h2>
          <p>
            Квант-знаний опубликован под лицензией GNU GPL v3.0 или новее. Вы можете свободно читать код, запускать,
            изменять и распространять его на условиях этой лицензии — включая запуск собственного экземпляра. Эти
            условия регулируют использование <em>конкретно этого</em> размещённого экземпляра; они не ограничивают
            права, которые GPL даёт вам на само программное обеспечение. Если они когда-либо противоречат друг другу в
            части ПО, приоритет у лицензии.
          </p>
        </section>

        {/*
          Supplied by the optional module. A build without it sells nothing, so
          there is nothing here to describe — and describing it anyway would be
          a false statement in a document people rely on.
        */}
        {PurchaseTerms ? <PurchaseTerms /> : null}

        <section>
          <h2 className="text-2xl font-semibold mb-3">Доступность</h2>
          <p>
            Мы стараемся держать сервис работающим, а ваши данные — в сохранности, но не обещаем, что он всегда будет
            доступен и без ошибок. Это планировщик, а не критически важная система: не полагайтесь на него как на
            единственное место записи важного дедлайна. Мы можем менять или прекращать функции, и перед удалением
            чего-то, от чего зависят пользователи, мы дадим разумное предупреждение.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Ответственность</h2>
          <p>
            В той мере, в которой это позволяет закон, сервис предоставляется без гарантий, и мы не несём
            ответственности за пропущенный дедлайн, потерянную оценку или любой другой ущерб, возникший из-за
            использования сервиса. Ничто здесь не ограничивает ответственность, которую нельзя законно ограничить, —
            включая ответственность за вред жизни и здоровью по неосторожности или за мошенничество.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Изменения этих условий</h2>
          <p>
            Мы можем обновлять эти условия. Если изменение существенно вас затрагивает, мы предупредим до его вступления
            в силу — и если вы за что-то заплатили, мы не используем смену условий, чтобы отнять оплаченное. Продолжая
            пользоваться сервисом после изменения, вы принимаете обновлённые условия.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Прекращение использования</h2>
          <p>
            Вы можете перестать пользоваться сервисом и удалить аккаунт в любой момент, по любой причине, не объясняя
            её. Мы можем закрыть аккаунт, нарушающий эти условия. Если мы закроем ваш аккаунт без причины, а вы оплатили
            что-то, чем больше не можете пользоваться, мы вернём деньги.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Контакты</h2>
          <p>
            Вопросы по этим условиям отправляйте на <CopyEmailButton address={CONTACT_ADDRESS} label={CONTACT_LABEL} />
          </p>
        </section>

        <p className="text-sm text-gray-500 dark:text-gray-400 mt-8">Последнее обновление: 8 сентября 2026 г.</p>
      </div>

      <footer className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-muted-foreground">
          <Link href="/auth/login" className="hover:text-foreground underline-offset-4 hover:underline">
            Вход
          </Link>
          <span className="hidden sm:inline">·</span>
          <Link href="/preview" className="hover:text-foreground underline-offset-4 hover:underline">
            Предпросмотр
          </Link>
          <span className="hidden sm:inline">·</span>
          <Link href="/privacy" className="hover:text-foreground underline-offset-4 hover:underline">
            Конфиденциальность
          </Link>
        </div>
      </footer>
    </div>
  );
}
