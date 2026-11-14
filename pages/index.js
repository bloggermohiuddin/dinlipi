import { useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { CalendarDays } from "lucide-react";

// The app has two screens: daily log and reports. Old links to "/" land here.
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/daily");
  }, [router]);

  return (
    <div className="card" style={{ padding: 24, textAlign: "center" }}>
      <span className="page-head-icon" style={{ margin: "0 auto 12px" }}>
        <CalendarDays size={22} strokeWidth={1.8} />
      </span>
      <div className="small strong">দৈনিক লগে নিয়ে যাচ্ছি…</div>
      <div className="tiny muted" style={{ marginTop: 6 }}>
        না গেলে <Link href="/daily">এখানে চাপুন</Link>।
      </div>
    </div>
  );
}
