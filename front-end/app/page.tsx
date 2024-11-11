"use client";

import YouTube from "react-youtube";

export default function Home() {
  return (
    <div className='fixed inset-0 z-50 bg-black flex justify-center items-center '>
      <YouTube
        videoId='Zxjxk9AQHmI' // Replace with your YouTube Short video ID
        opts={{
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
          },
          height: window.innerHeight,
          width: window.innerWidth,
        }}
        className='w-screen h-screen'
      />
    </div>
  );
}
