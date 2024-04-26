"use client";

import Link from "next/link";

const localdata = localStorage.getItem("slides") || null;
const data = JSON.parse(localdata);

console.log(data)

export default function Home() {
  return (
    <div className="p-8 mx-auto max-w-4xl h-svh flex flex-col">
      <div className="text-6xl bg-gradient-to-r from-pink-500 via-blue-500 to-blue-700 bg-clip-text text-transparent">
        Hello Nils
      </div>
      <p className="text-neutral-500 font-medium text-3xl">
        Erstelle eine Präsentation
      </p>
      <div className="mt-8 text-xs font-medium text-neutral-500">
        Local data
      </div>
      <div className="grid grid-cols-4 gap-4 mt-4">
        {data &&
          data.map((item: { id: string; content: string; title: string }) => (
            <Link key={item.id} href={`/editor?id=${item.id}`}>
              <div className=" p-4 rounded-lg border hover:bg-neutral-900">
                <h1 className="text-lg aspect-square">{item.title}</h1>
              </div>
            </Link>
          ))}
      </div>
      <div className="text-xs text-neutral-500 flex justify-end mt-4">
        show more
      </div>
      <div className="grow"></div>
      <div className="p-4 rounded-lg font-medium bg-white text-black max-w-min whitespace-nowrap">
        Blank presentation
      </div>
    </div>
  );
}
