"use client";
export default function ErrorPage({ reset }: { reset: () => void }) { return <div className="message" role="alert"><h1>Something went wrong.</h1><p>Please try again in a moment.</p><button className="secondary" onClick={reset}>Try again</button></div>; }
