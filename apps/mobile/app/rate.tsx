import { useRouter } from "expo-router";

import { RateView } from "../src/components/rate-view";
import { WORKER_RATE_TAGS, firstName, gigById } from "../src/data/mock";
import { useGigStore } from "../src/store/gig-store";

export default function WorkerRateScreen() {
  const router = useRouter();
  const wGig = useGigStore((s) => s.wGig);
  const stars = useGigStore((s) => s.stars);
  const rtags = useGigStore((s) => s.rtags);
  const comment = useGigStore((s) => s.comment);
  const setStars = useGigStore((s) => s.setStars);
  const toggleRtag = useGigStore((s) => s.toggleRtag);
  const setComment = useGigStore((s) => s.setComment);
  const submitRate = useGigStore((s) => s.submitRate);
  const skipRate = useGigStore((s) => s.skipRate);

  const gig = gigById(wGig);
  const goHome = () => router.navigate("/(worker)/my-gigs");

  return (
    <RateView
      forName={`${firstName(gig.er)} · ${gig.biz}`}
      paySub={`₱${gig.pay} · paid in cash · ${gig.t}`}
      note={"Reviews only exist on PIN-completed gigs —\nthat's why ratings here mean something."}
      tags={WORKER_RATE_TAGS}
      selectedTags={rtags}
      stars={stars}
      comment={comment}
      placeholder="Say a word about the gig (optional)"
      onStar={setStars}
      onToggleTag={toggleRtag}
      onComment={setComment}
      onSubmit={() => {
        if (stars === 0) return;
        submitRate();
        goHome();
      }}
      onSkip={() => {
        skipRate();
        goHome();
      }}
    />
  );
}
