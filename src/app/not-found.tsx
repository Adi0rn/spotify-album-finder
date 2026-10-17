import Link from "next/link";
export default function NotFound() { return <div className="empty"><h1>Record not found.</h1><p>This album link doesn’t look right.</p><Link className="secondary" href="/">Back to search</Link></div>; }
