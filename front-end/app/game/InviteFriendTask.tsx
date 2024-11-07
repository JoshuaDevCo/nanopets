"use client";

import { initUtils } from "@telegram-apps/sdk";

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
      {" "}
      <div className='flex flex-col space-y-4'>
        <button
          onClick={handleInviteFriend}
          className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 '
        >
          Invite Friend
        </button>
        <button
          onClick={handleCopyLink}
          className='bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 '
        >
          Copy Invite Link
        </button>
      </div>
    </>
  );
}
