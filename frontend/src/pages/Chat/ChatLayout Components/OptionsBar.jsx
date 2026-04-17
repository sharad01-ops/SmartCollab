import { useParams } from 'react-router-dom'

const OptionsBar = () => {
  const { communityId } = useParams()

  return (
    <div className="h-[72px] flex-shrink-0 flex items-center px-6 bg-[#FFFFFF] border-b border-[#E8E4DE] border-opacity-60">
      <span className="text-gray-900 font-bold text-lg truncate">
        {communityId ? 'Community' : 'Community'}
      </span>
    </div>
  )
}

export default OptionsBar
