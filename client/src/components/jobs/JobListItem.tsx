
import { Heart } from "lucide-react"

interface JobListItemProps {
  salary: string
  title: string
  schedule: string
  location: string
  isAboveAverage?: boolean
  postedTime: string
}

export function JobListItem({ salary, title, schedule, location, isAboveAverage, postedTime }: JobListItemProps) {
  return (
    <div className="relative rounded-lg border bg-white p-4 shadow-sm">
      <div className="flex justify-between">
        <div>
          {isAboveAverage && <div className="mb-2 text-sm text-gray-600">Above avg. rate</div>}
          <div className="text-xl font-bold">{salary}/wk</div>
          <h3 className="mt-1 font-medium">{title}</h3>
          <div className="mt-1 text-sm text-gray-600">{schedule}</div>
        </div>
        <button className="absolute right-4 top-4 rounded-full p-2 hover:bg-gray-100">
          <Heart className="h-5 w-5" />
        </button>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="text-sm text-gray-600">{location}</span>
      </div>
      <div className="absolute right-4 top-0 -translate-y-1/2 rounded-full bg-[#E6F3FF] px-3 py-1 text-xs">
        {postedTime}
      </div>
    </div>
  )
}
