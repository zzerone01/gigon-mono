import { useRouter } from "expo-router";

import { RateView } from "../src/components/rate-view";
import { EMPLOYER_RATE_TAGS } from "../src/data/mock";
import { useGigStore, useMatchedApplicant } from "../src/store/gig-store";

export default function EmployerRateScreen() {
  const router = useRouter();
  const eStars = useGigStore((s) => s.eStars);
  const etags = useGigStore((s) => s.etags);
  const eComment = useGigStore((s) => s.eComment);
  const setEStars = useGigStore((s) => s.setEStars);
  const toggleEtag = useGigStore((s) => s.toggleEtag);
  const setEComment = useGigStore((s) => s.setEComment);
  const submitERate = useGigStore((s) => s.submitERate);
  const skipERate = useGigStore((s) => s.skipERate);
  const posting = useGigStore((s) => s.posting);
  const a = useMatchedApplicant();

  const goHome = () => router.navigate("/(employer)/postings");

  return (
    <RateView
      forName={a.name}
      paySub={`₱${posting?.pay ?? ""} · paid in cash · ${posting?.title ?? ""}`}
      note={"Your review appears on her profile —\nreliable workers rise, no-shows fade."}
      tags={EMPLOYER_RATE_TAGS}
      selectedTags={etags}
      stars={eStars}
      comment={eComment}
      placeholder="Say a word about the work (optional)"
      onStar={setEStars}
      onToggleTag={toggleEtag}
      onComment={setEComment}
      onSubmit={() => {
        if (eStars === 0) return;
        submitERate();
        goHome();
      }}
      onSkip={() => {
        skipERate();
        goHome();
      }}
    />
  );
}
