"use client";

import { Bookstore } from "../types/supabase";
import {
  MapPinIcon,
  ClockIcon,
  BuildingLibraryIcon,
  SparklesIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

interface BookstoreCardProps {
  bookstore: Bookstore;
  isWantToGo: boolean;
  isVisited: boolean;
  onMarkWantToGo: (bookstoreId: string) => void;
  onMarkVisited: (bookstoreId: string) => void;
  isMarking: boolean;
  isAuthenticated: boolean;
}

export function BookstoreCard({
  bookstore,
  isWantToGo,
  isVisited,
  onMarkWantToGo,
  onMarkVisited,
  isMarking,
  isAuthenticated,
}: BookstoreCardProps) {
  // Google MapsのURLを生成（店舗名を含める）
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${bookstore.registered_name} ${bookstore.prefecture}${bookstore.city}${bookstore.address}`
  )}`;

  const handleWantToGo = () => {
    if (isMarking) return;
    onMarkWantToGo(bookstore.id);
  };

  const handleVisited = () => {
    if (isMarking) return;
    onMarkVisited(bookstore.id);
  };

  return (
    <div className="border-b border-gray-200 py-4 flex justify-between items-center">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-gray-800">
          {bookstore.number}. {bookstore.registered_name}
          {bookstore.special_edition && (
            <SparklesIcon
              className="inline-block w-5 h-5 ml-1 text-yellow-500"
              title="特装版取扱店舗"
            />
          )}
          {bookstore.close_info && (
            <XCircleIcon
              className="inline-block w-5 h-5 ml-1 text-red-500"
              title={`閉店: ${bookstore.close_info}`}
            />
          )}
        </h3>
        <p className="text-sm text-gray-600 flex items-center">
          <MapPinIcon className="inline-block w-4 h-4 mr-1" />
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:text-primary hover:underline"
          >
            {bookstore.prefecture} {bookstore.city} {bookstore.address}
          </a>
        </p>
        <div className="flex space-x-4 text-sm text-gray-500">
          {bookstore.opening_hour && (
            <span className="flex items-center">
              <ClockIcon className="inline-block w-4 h-4 mr-1" />
              営業時間: {bookstore.opening_hour}
            </span>
          )}
          {bookstore.establishment_year && (
            <span className="flex items-center">
              <BuildingLibraryIcon className="inline-block w-4 h-4 mr-1" />
              開業: {bookstore.establishment_year}
            </span>
          )}
        </div>
      </div>
      {isAuthenticated && (
        <div className="flex space-x-2">
          <button
            onClick={handleWantToGo}
            className={`px-3 py-1 text-sm font-medium text-white ${
              isWantToGo
                ? "bg-pink-600 hover:bg-pink-700"
                : "bg-blue-600 hover:bg-blue-700"
            } rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed`}
            disabled={isWantToGo || isVisited || isMarking}
          >
            {isMarking
              ? "処理中..."
              : isWantToGo
              ? "行きたい登録済"
              : "行きたい"}
          </button>
          <button
            onClick={handleVisited}
            className={`px-3 py-1 text-sm font-medium text-white ${
              isVisited
                ? "bg-lime-600 hover:bg-lime-700"
                : "bg-green-600 hover:bg-green-700"
            } rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed`}
            disabled={isVisited || isMarking}
          >
            {isMarking ? "処理中..." : isVisited ? "行った登録済" : "行った"}
          </button>
        </div>
      )}
    </div>
  );
}
