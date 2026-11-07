import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { NftImage } from '@/components/nft-image'
import { featuredNftsQuery } from '../queries'

/** Banner "NFT em destaque" da barra lateral. */
export function FeaturedBanner() {
  const { data, isPending } = useQuery(featuredNftsQuery())
  const featured = data?.items[0]

  if (isPending) return <div className="skeleton h-[470px]" aria-hidden />
  if (!featured) return null

  return (
    <Link
      to="/nft/$nftId"
      params={{ nftId: featured.id }}
      className="relative block overflow-hidden bg-linear-to-b from-brand/10 to-brand/[0.03] pt-6 pb-1 transition-[filter] hover:brightness-110"
      aria-label={`NFT em destaque, oferta limitada: ${featured.name}`}
    >
      <p aria-hidden className="px-5 text-center text-2xl leading-8 font-bold text-brand-accent">
        NFT EM DESTAQUE
      </p>
      <p aria-hidden className="mt-4 px-5 text-center text-[22px] leading-4 font-bold">
        OFERTA LIMITADA
      </p>
      <div className="mt-4 aspect-[310/368] overflow-hidden rounded-[22px]">
        <NftImage artwork={featured.artwork} alt="" sizes="310px" className="size-full" />
      </div>
      <span
        aria-hidden
        className="absolute top-[105px] left-[38px] size-[15px] rounded-[29px] bg-linear-to-b from-brand to-transparent"
      />
      <span
        aria-hidden
        className="absolute right-[17px] bottom-[84px] size-[45px] rounded-[29px] bg-linear-to-b from-brand to-transparent"
      />
    </Link>
  )
}
