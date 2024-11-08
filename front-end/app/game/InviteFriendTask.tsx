"use client";

import { initUtils } from "@telegram-apps/sdk";
import Image from "next/image";
import Coin from "../svgs/coin.png";

interface InviteFriendTaskProps {
  userId: string;
}

export default function InviteFriendTask({ userId }: InviteFriendTaskProps) {
  const INVITE_URL = "https://t.me/KodoMochiBot/play";

  const handleInviteFriend = () => {
    const utils = initUtils();
    const inviteLink = `${INVITE_URL}?start=${userId}`;
    const shareText = `Get your own virtual Pet.`;
    const fullUrl = `https://t.me/share/url?url=${encodeURIComponent(
      inviteLink
    )}&text=${encodeURIComponent(shareText)}`;
    utils.openTelegramLink(fullUrl);
  };

  const handleCopyLink = () => {
    const inviteLink = `${INVITE_URL}?start=${userId}`;
    navigator.clipboard.writeText(inviteLink);
    alert("Invite link copied to clipboard!");
  };

  return (
    <>
      <div className='flex flex-col space-y-4'>
        <button
          onClick={handleInviteFriend}
          className='bg-blue-500  text-white font-bold py-2 px-4 '
        >
          <div className='flex gap-2'>
            <p>Invite friend +5</p>
            <Image
              className='mr-2 aspect-square'
              width={20}
              height={15}
              alt='coin'
              src={Coin}
            />
          </div>
        </button>
        <button
          onClick={handleCopyLink}
          className='bg-blue-500  text-white font-bold py-2 px-4 '
        >
          <div className='flex gap-2'>
            <p>Copy Invite Link +5</p>
            <Image
              className='mr-2 aspect-square'
              width={20}
              height={15}
              alt='coin'
              src={Coin}
            />
          </div>
        </button>
      </div>
    </>
  );
}
