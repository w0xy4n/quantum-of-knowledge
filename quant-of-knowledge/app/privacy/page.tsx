import Link from "next/link";
import { CopyEmailButton } from "@/components/copy-email-button";
import { proSection } from "@/lib/pro";

/**
 * A server component, so it can ask the optional module whether there is
 * anything extra to disclose. Without that module there is not, and the page
 * renders exactly what is true of the software in this repository.
 *
 * The contact address is a placeholder for whoever runs the instance. If you
 * are self-hosting, `data@evermind.today` is not your address — change it.
 */

const CONTACT_ADDRESS = "data@evermind.today";
const CONTACT_LABEL = "data [at] evermind (dot) today";

export default function PrivacyPage() {
  // Supplied only by the commercial module. In its absence this page must not
  // name a payment processor, because a build without it does not use one, and
  // saying otherwise would be a false statement about data handling.
  const PaymentProcessing = proSection("privacy-payment");

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold mb-6">Политика конфиденциальности</h1>

      <div className="space-y-6 text-gray-700 dark:text-gray-300">
        <section>
          <h2 className="text-2xl font-semibold mb-3">Введение</h2>
          <p>
            Эта политика описывает, как Квант-знаний собирает, использует и защищает ваши персональные данные, когда вы
            пользуетесь сервисом.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Какие данные мы собираем</h2>
          <p className="mb-2">Мы собираем данные, которые вы предоставляете нам напрямую, в том числе:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Данные аккаунта (адрес электронной почты, имя)</li>
            <li>Задания и задачи</li>
            <li>Информацию об использовании и настройки</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Как мы используем ваши данные</h2>
          <p className="mb-2">Мы используем собранные данные, чтобы:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Предоставлять, поддерживать и улучшать сервис</li>
            <li>Обрабатывать и завершать операции</li>
            <li>Отправлять технические уведомления и сообщения поддержки</li>
            <li>Отвечать на ваши вопросы и комментарии</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Безопасность данных</h2>
          <p>
            Мы применяем подходящие технические и организационные меры, чтобы защитить ваши персональные данные от
            несанкционированного доступа, изменения, раскрытия или уничтожения.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Обращение с данными</h2>
          <p>
            Мы не продаём, не обмениваем и не сдаём в аренду ваши персональные данные третьим лицам. Мы можем передавать
            данные доверенным поставщикам услуг, которые помогают нам работать и обслуживать вас.
            <br />
            <br />
            Вы можете в любой момент самостоятельно выгрузить или удалить свои данные на{" "}
            <Link href="/settings" className="underline decoration-solid hover:opacity-70 transition-opacity">
              странице настроек
            </Link>
            . По остальным вопросам пишите на <CopyEmailButton address={CONTACT_ADDRESS} label={CONTACT_LABEL} />
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Сторонние сервисы</h2>
          <p>
            Мы используем сторонние сервисы для аутентификации и хранения данных. У этих сервисов есть собственные
            политики конфиденциальности, регулирующие использование ваших данных.
          </p>
        </section>

        {/*
          Only rendered where the optional module is installed. It adds the
          processor involved in taking a payment, and says that card details
          never reach Evermind.
        */}
        {PaymentProcessing ? <PaymentProcessing /> : null}

        <section>
          <h2 className="text-2xl font-semibold mb-3">Как долго мы храним данные</h2>
          <p>
            Ваш аккаунт и задания в нём хранятся, пока вы не удалите их сами. Удаление аккаунта на{" "}
            <Link href="/settings" className="underline decoration-solid hover:opacity-70 transition-opacity">
              странице настроек
            </Link>{" "}
            немедленно стирает аккаунт и всё, что в нём, — копии мы не храним. Периода на восстановление нет, поэтому
            если данные нужны — сначала выгрузите их.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Ваши права</h2>
          <p className="mb-2">Вы имеете право:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Получить доступ к своим персональным данным и их копию</li>
            <li>Потребовать исправления своих данных</li>
            <li>Потребовать удаления своих данных</li>
            <li>Возразить против обработки своих данных</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Изменения этой политики</h2>
          <p>
            Мы можем время от времени обновлять эту политику. Обо всех изменениях мы сообщим, опубликовав новую версию
            на этой странице.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Связаться с нами</h2>
          <p>
            Если у вас есть вопросы об этой политике, напишите нам:{" "}
            <CopyEmailButton address={CONTACT_ADDRESS} label={CONTACT_LABEL} />
          </p>
        </section>

        <p className="text-sm text-gray-500 dark:text-gray-400 mt-8">Последнее обновление: 8 сентября 2026 г.</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Квант-знаний не связан ни с одним учебным заведением. Мы — независимый сервис.
        </p>
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
          <Link href="/terms" className="hover:text-foreground underline-offset-4 hover:underline">
            Условия
          </Link>
        </div>
      </footer>
    </div>
  );
}
