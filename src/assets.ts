import { getAddress } from '@ethersproject/address'
import { NowRequest, NowResponse } from '@now/node'

import { getBundleEthPrice, getTopPairs, Pair } from './_shared'
import { return200, return500 } from './utils/response'

interface ReturnShape {
  [tokenAddress: string]: { id: string; name: string; symbol: string; maker_fee: '0'; taker_fee: '0.002' }
}

export default async function(req: NowRequest, res: NowResponse): Promise<void> {
  try {
    const ethPriceData = await getBundleEthPrice()
    const ethPrice = ethPriceData?.bundle?.ethPrice
    const pairs = await getTopPairs()

    const tokens = pairs.reduce<{
      [tokenAddress: string]: { id: string; name: string; symbol: string; maker_fee: '0'; taker_fee: '0.002' }
    }>((memo: ReturnShape, pair: Pair): ReturnShape => {
      for (let token of [pair.token0, pair.token1]) {
        console.log('ethPrice', ethPrice)

        const id = getAddress(token.id)
        if (memo[id]) continue
        if (parseFloat(token?.derivedETH) > 0) {
          memo[id] = {
            price_bnb: token?.derivedETH,
            price_usd: ethPrice * token?.derivedETH,
            id,
            name: token.name,
            symbol: token.symbol,
            maker_fee: '0',
            taker_fee: '0.002'
          }
        }
      }
      return memo
    }, {})
    return200(res, tokens, 60 * 60 * 24)
  } catch (error) {
    return500(res, error)
  }
}
