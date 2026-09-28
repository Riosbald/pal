import { ActivationDemo } from "@/components/mimo/ActivationDemo";

export const metadata = {
  title: "M\u00cdMO \u00b7 Activation demo",
  description:
    "Three-state representation gap demo: UNDERSTOOD, POSSIBLE_MEANING_LOSS, INSUFFICIENT_KNOWLEDGE.",
};

export default function MimoDemoPage() {
  return (
    <main className="min-h-screen bg-neutral-950">
      <ActivationDemo />
    </main>
  );
}
