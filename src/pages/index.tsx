import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { Header } from "../components/Header";
import { api } from "../utils/api";
import { UserSettings } from "../server/user";

export default function Home() {
  const { data: session } = useSession();
  const { data: token } = api.user.getToken.useQuery();
  const { data: settings } = api.user.getSettings.useQuery();
  const updateSettings = api.user.updateSettings.useMutation();
  const { register, handleSubmit } = useForm<UserSettings>();

  return (
    <div>
      <Header />
      <main className="mx-auto max-w-7xl py-6 px-4 sm:px-6 lg:px-8">
        <form
          className="space-y-6"
          onSubmit={handleSubmit((data) => updateSettings.mutate(data))}
        >
          <div>
            <label htmlFor="userId">user id</label>
            <input
              type="text"
              name="userId"
              id="userId"
              value={token || ""}
              readOnly
            />
          </div>
          <div>
            <label htmlFor="billyApiKey">billy api key</label>
            <input
              type="text"
              {...register("billyApiKey")}
              id="billyApiKey"
              defaultValue={settings?.billyApiKey || ""}
            />
          </div>
          <div>
            <label htmlFor="stripeApiKey">stripe api key</label>
            <input
              type="text"
              {...register("stripeApiKey")}
              id="stripeApiKey"
              defaultValue={settings?.stripeApiKey || ""}
            />
          </div>
          <div>
            <label htmlFor="stripeWebhookSecret">stripe webhook secret</label>
            <input
              type="text"
              {...register("stripeWebhookSecret")}
              id="stripeWebhookSecret"
              defaultValue={settings?.stripeWebhookSecret || ""}
            />
          </div>
          <button type="submit">save</button>
        </form>
      </main>
    </div>
  );
}
