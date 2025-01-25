import Image from 'next/image'
import React from 'react'
import { CldImage } from 'next-cloudinary'
import { debounce, getImageSize } from '@/lib/utils'
import { dataUrl } from '@/lib/utils'
import { PlaceholderValue } from 'next/dist/shared/lib/get-img-props'

const TransformImage = ({
    image, type, title, 
    transformationConfig, isTransforming, 
    setIsTransforming, hasDownload = false
}: TransformedImageProps) => {
    const downloadHandler = () => {}
  return (
    <div className='flex flex-col gap-4'>
        <div className='flex-between '>
            <h3 className='h3-bold text-dark-600'>
                Transformed
            </h3>
            {hasDownload && (
                <button className='download-btn' onClick={downloadHandler}>
                    <Image 
                        src='/images/download.svg'
                        alt='download'
                        width={24}
                        height={24}
                        className='pb-[6px]'
                    />
                </button>
            )}

            {image?.publicId && (transformationConfig ? (
                <div className='relative'>
                    <CldImage 
                        width={getImageSize(type, image, "width")}
                        height={getImageSize(type, image, "height")}
                        src={image?.publicId}
                        alt={image.title}
                        sizes={"(max-width: 767px) 100vw,  50vw"}
                        placeholder={dataUrl as PlaceholderValue}
                        className='transformed-image'
                        onLoad={()=> {
                            setIsTransforming &&
                            setIsTransforming(false)
                        }}
                        onError={()=> {
                            debounce(()=> {
                                setIsTransforming && setIsTransforming(false)
                            }, 8000)
                        }}
                        {...transformationConfig}
                    />

                    {isTransforming && (
                        <div className='transforming-loader'>
                            <Image src='/assets/icons/spinner.svg' width={50} height={50} alt='load'/>
                        </div>
                    )}
                </div>
            ):(
                <div className='transform-placeholder'>
                    Transform Image
                </div>
            ))}
        </div>
    </div>
  )
}

export default TransformImage