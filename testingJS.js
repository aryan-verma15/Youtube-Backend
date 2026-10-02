const url = 'http://res.cloudinary.com/dxpsxo7x8/video/upload/v1750331103/hdpagserkf0tin03szlq.mp4'

const splitedURL = url.split('/')
const publicID = splitedURL[splitedURL.length - 1]
// console.log(publicID.split('.')[0])

const getPublicID = (url) => {
    const urlParts = url.split('/')
    const fileName = urlParts[urlParts.length - 1]
    const public_id = fileName.split('.')[0]
    return public_id
}
console.log(getPublicID(url))