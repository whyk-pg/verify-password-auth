import type { MetaFunction } from "@remix-run/cloudflare";

export const meta: MetaFunction = () => {
  return [
    { title: "Verify Password Auth" },
    { name: "description", content: "Verify Password Auth" },
  ];
};

export default function Index() {
  return (
    <>
      <p>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Enim unde
        itaque quia, a libero, minima quidem fugit dignissimos alias dolorum
        eveniet quis beatae non autem quibusdam necessitatibus, dolores soluta
        praesentium! Lorem ipsum dolor sit amet consectetur adipisicing elit.
        Ducimus enim sunt officiis nam ea nulla deserunt nemo tenetur in
        corporis libero, dolore voluptates reprehenderit fugiat neque earum,
        voluptate esse sed.
      </p>
      <a href="/contents">コンテンツページへ行く</a>
    </>
  );
}
