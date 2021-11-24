import { useEffect, useState } from 'react';
import { ethers } from 'ethers';

import { getProvider } from '../../../helpers/config/markets-and-network-config';
import {
  UiIncentiveDataProvider,
  UserReserveIncentiveDataHumanizedResponse,
  Denominations,
  ChainId,
} from '@aave/contract-helpers';
import { useProtocolDataContext } from '../../protocol-data-provider';

// interval in which the rpc data is refreshed
const POOLING_INTERVAL = 30 * 1000;
// decreased interval in case there was a network error for faster recovery
const RECOVER_INTERVAL = 10 * 1000;

// From UiIncentiveDataProvider
export interface ReserveIncentiveData {
  underlyingAsset: string;
  aIncentiveData: ReserveTokenIncentives;
  vIncentiveData: ReserveTokenIncentives;
  sIncentiveData: ReserveTokenIncentives;
}

// From UiIncentiveDataProvider
export interface UserReserveIncentiveData {
  underlyingAsset: string;
  aTokenIncentivesUserData: UserTokenIncentives;
  vTokenIncentivesUserData: UserTokenIncentives;
  sTokenIncentivesUserData: UserTokenIncentives;
}

interface ReserveTokenIncentives {
  emissionPerSecond: string;
  incentivesLastUpdateTimestamp: number;
  tokenIncentivesIndex: string;
  emissionEndTimestamp: number;
  tokenAddress: string;
  rewardTokenAddress: string;
  incentiveControllerAddress: string;
  rewardTokenDecimals: number;
  precision: number;
  priceFeed: string;
  priceFeedTimestamp: number;
  priceFeedDecimals: number;
}

interface UserTokenIncentives {
  tokenIncentivesUserIndex: string;
  userUnclaimedRewards: string;
  tokenAddress: string;
  rewardTokenAddress: string;
  incentiveControllerAddress: string;
  rewardTokenDecimals: number;
}
export interface IncentiveDataResponse {
  loading: boolean;
  error: boolean;
  data: {
    reserveIncentiveData?: ReserveIncentiveData[];
    userIncentiveData?: UserReserveIncentiveData[];
  };
  refresh: () => Promise<void>;
}

// Fetch reserve and user incentive data from UiIncentiveDataProvider
export function useIncentivesData(
  lendingPoolAddressProvider: string,
  chainId: ChainId,
  incentiveDataProviderAddress: string | undefined,
  skip: boolean,
  userAddress?: string
): IncentiveDataResponse {
  const { networkConfig } = useProtocolDataContext();
  const currentAccount: string | undefined = userAddress ? userAddress.toLowerCase() : undefined;
  const [loadingReserveIncentives, setLoadingReserveIncentives] = useState<boolean>(true);
  const [errorReserveIncentives, setErrorReserveIncentives] = useState<boolean>(false);
  const [loadingUserIncentives, setLoadingUserIncentives] = useState<boolean>(true);
  const [errorUserIncentives, setErrorUserIncentives] = useState<boolean>(false);
  const [reserveIncentiveData, setReserveIncentiveData] = useState<
    ReserveIncentiveData[] | undefined
  >(undefined);
  const [userIncentiveData, setUserIncentiveData] = useState<
    UserReserveIncentiveData[] | undefined
  >(undefined);

  // Fetch reserve incentive data and user incentive data only if currentAccount is set
  const fetchData = async (
    currentAccount: string | undefined,
    lendingPoolAddressProvider: string,
    incentiveDataProviderAddress: string
  ) => {
    fetchReserveIncentiveData(lendingPoolAddressProvider, incentiveDataProviderAddress);
    if (currentAccount && currentAccount !== ethers.constants.AddressZero) {
      fetchUserIncentiveData(
        currentAccount,
        lendingPoolAddressProvider,
        incentiveDataProviderAddress
      );
    } else {
      setLoadingUserIncentives(false);
    }
  };

  const abi = [
    {
      "inputs": [
        {
          "internalType": "contract ILendingPoolAddressesProvider",
          "name": "provider",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "user",
          "type": "address"
        }
      ],
      "name": "getFullReservesIncentiveData",
      "outputs": [
        {
          "components": [
            {
              "internalType": "address",
              "name": "underlyingAsset",
              "type": "address"
            },
            {
              "components": [
                {
                  "internalType": "uint256",
                  "name": "emissionPerSecond",
                  "type": "uint256"
                },
                {
                  "internalType": "uint256",
                  "name": "incentivesLastUpdateTimestamp",
                  "type": "uint256"
                },
                {
                  "internalType": "uint256",
                  "name": "tokenIncentivesIndex",
                  "type": "uint256"
                },
                {
                  "internalType": "uint256",
                  "name": "emissionEndTimestamp",
                  "type": "uint256"
                },
                {
                  "internalType": "address",
                  "name": "tokenAddress",
                  "type": "address"
                },
                {
                  "internalType": "address",
                  "name": "rewardTokenAddress",
                  "type": "address"
                },
                {
                  "internalType": "address",
                  "name": "incentiveControllerAddress",
                  "type": "address"
                },
                {
                  "internalType": "uint8",
                  "name": "rewardTokenDecimals",
                  "type": "uint8"
                },
                {
                  "internalType": "uint8",
                  "name": "precision",
                  "type": "uint8"
                }
              ],
              "internalType": "struct IUiIncentiveDataProvider.IncentiveData",
              "name": "aIncentiveData",
              "type": "tuple"
            },
            {
              "components": [
                {
                  "internalType": "uint256",
                  "name": "emissionPerSecond",
                  "type": "uint256"
                },
                {
                  "internalType": "uint256",
                  "name": "incentivesLastUpdateTimestamp",
                  "type": "uint256"
                },
                {
                  "internalType": "uint256",
                  "name": "tokenIncentivesIndex",
                  "type": "uint256"
                },
                {
                  "internalType": "uint256",
                  "name": "emissionEndTimestamp",
                  "type": "uint256"
                },
                {
                  "internalType": "address",
                  "name": "tokenAddress",
                  "type": "address"
                },
                {
                  "internalType": "address",
                  "name": "rewardTokenAddress",
                  "type": "address"
                },
                {
                  "internalType": "address",
                  "name": "incentiveControllerAddress",
                  "type": "address"
                },
                {
                  "internalType": "uint8",
                  "name": "rewardTokenDecimals",
                  "type": "uint8"
                },
                {
                  "internalType": "uint8",
                  "name": "precision",
                  "type": "uint8"
                }
              ],
              "internalType": "struct IUiIncentiveDataProvider.IncentiveData",
              "name": "vIncentiveData",
              "type": "tuple"
            },
            {
              "components": [
                {
                  "internalType": "uint256",
                  "name": "emissionPerSecond",
                  "type": "uint256"
                },
                {
                  "internalType": "uint256",
                  "name": "incentivesLastUpdateTimestamp",
                  "type": "uint256"
                },
                {
                  "internalType": "uint256",
                  "name": "tokenIncentivesIndex",
                  "type": "uint256"
                },
                {
                  "internalType": "uint256",
                  "name": "emissionEndTimestamp",
                  "type": "uint256"
                },
                {
                  "internalType": "address",
                  "name": "tokenAddress",
                  "type": "address"
                },
                {
                  "internalType": "address",
                  "name": "rewardTokenAddress",
                  "type": "address"
                },
                {
                  "internalType": "address",
                  "name": "incentiveControllerAddress",
                  "type": "address"
                },
                {
                  "internalType": "uint8",
                  "name": "rewardTokenDecimals",
                  "type": "uint8"
                },
                {
                  "internalType": "uint8",
                  "name": "precision",
                  "type": "uint8"
                }
              ],
              "internalType": "struct IUiIncentiveDataProvider.IncentiveData",
              "name": "sIncentiveData",
              "type": "tuple"
            }
          ],
          "internalType": "struct IUiIncentiveDataProvider.AggregatedReserveIncentiveData[]",
          "name": "",
          "type": "tuple[]"
        },
        {
          "components": [
            {
              "internalType": "address",
              "name": "underlyingAsset",
              "type": "address"
            },
            {
              "components": [
                {
                  "internalType": "uint256",
                  "name": "tokenincentivesUserIndex",
                  "type": "uint256"
                },
                {
                  "internalType": "uint256",
                  "name": "userUnclaimedRewards",
                  "type": "uint256"
                },
                {
                  "internalType": "address",
                  "name": "tokenAddress",
                  "type": "address"
                },
                {
                  "internalType": "address",
                  "name": "rewardTokenAddress",
                  "type": "address"
                },
                {
                  "internalType": "address",
                  "name": "incentiveControllerAddress",
                  "type": "address"
                },
                {
                  "internalType": "uint8",
                  "name": "rewardTokenDecimals",
                  "type": "uint8"
                }
              ],
              "internalType": "struct IUiIncentiveDataProvider.UserIncentiveData",
              "name": "aTokenIncentivesUserData",
              "type": "tuple"
            },
            {
              "components": [
                {
                  "internalType": "uint256",
                  "name": "tokenincentivesUserIndex",
                  "type": "uint256"
                },
                {
                  "internalType": "uint256",
                  "name": "userUnclaimedRewards",
                  "type": "uint256"
                },
                {
                  "internalType": "address",
                  "name": "tokenAddress",
                  "type": "address"
                },
                {
                  "internalType": "address",
                  "name": "rewardTokenAddress",
                  "type": "address"
                },
                {
                  "internalType": "address",
                  "name": "incentiveControllerAddress",
                  "type": "address"
                },
                {
                  "internalType": "uint8",
                  "name": "rewardTokenDecimals",
                  "type": "uint8"
                }
              ],
              "internalType": "struct IUiIncentiveDataProvider.UserIncentiveData",
              "name": "vTokenIncentivesUserData",
              "type": "tuple"
            },
            {
              "components": [
                {
                  "internalType": "uint256",
                  "name": "tokenincentivesUserIndex",
                  "type": "uint256"
                },
                {
                  "internalType": "uint256",
                  "name": "userUnclaimedRewards",
                  "type": "uint256"
                },
                {
                  "internalType": "address",
                  "name": "tokenAddress",
                  "type": "address"
                },
                {
                  "internalType": "address",
                  "name": "rewardTokenAddress",
                  "type": "address"
                },
                {
                  "internalType": "address",
                  "name": "incentiveControllerAddress",
                  "type": "address"
                },
                {
                  "internalType": "uint8",
                  "name": "rewardTokenDecimals",
                  "type": "uint8"
                }
              ],
              "internalType": "struct IUiIncentiveDataProvider.UserIncentiveData",
              "name": "sTokenIncentivesUserData",
              "type": "tuple"
            }
          ],
          "internalType": "struct IUiIncentiveDataProvider.UserReserveIncentiveData[]",
          "name": "",
          "type": "tuple[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "contract ILendingPoolAddressesProvider",
          "name": "provider",
          "type": "address"
        }
      ],
      "name": "getReservesIncentivesData",
      "outputs": [
        {
          "components": [
            {
              "internalType": "address",
              "name": "underlyingAsset",
              "type": "address"
            },
            {
              "components": [
                {
                  "internalType": "uint256",
                  "name": "emissionPerSecond",
                  "type": "uint256"
                },
                {
                  "internalType": "uint256",
                  "name": "incentivesLastUpdateTimestamp",
                  "type": "uint256"
                },
                {
                  "internalType": "uint256",
                  "name": "tokenIncentivesIndex",
                  "type": "uint256"
                },
                {
                  "internalType": "uint256",
                  "name": "emissionEndTimestamp",
                  "type": "uint256"
                },
                {
                  "internalType": "address",
                  "name": "tokenAddress",
                  "type": "address"
                },
                {
                  "internalType": "address",
                  "name": "rewardTokenAddress",
                  "type": "address"
                },
                {
                  "internalType": "address",
                  "name": "incentiveControllerAddress",
                  "type": "address"
                },
                {
                  "internalType": "uint8",
                  "name": "rewardTokenDecimals",
                  "type": "uint8"
                },
                {
                  "internalType": "uint8",
                  "name": "precision",
                  "type": "uint8"
                }
              ],
              "internalType": "struct IUiIncentiveDataProvider.IncentiveData",
              "name": "aIncentiveData",
              "type": "tuple"
            },
            {
              "components": [
                {
                  "internalType": "uint256",
                  "name": "emissionPerSecond",
                  "type": "uint256"
                },
                {
                  "internalType": "uint256",
                  "name": "incentivesLastUpdateTimestamp",
                  "type": "uint256"
                },
                {
                  "internalType": "uint256",
                  "name": "tokenIncentivesIndex",
                  "type": "uint256"
                },
                {
                  "internalType": "uint256",
                  "name": "emissionEndTimestamp",
                  "type": "uint256"
                },
                {
                  "internalType": "address",
                  "name": "tokenAddress",
                  "type": "address"
                },
                {
                  "internalType": "address",
                  "name": "rewardTokenAddress",
                  "type": "address"
                },
                {
                  "internalType": "address",
                  "name": "incentiveControllerAddress",
                  "type": "address"
                },
                {
                  "internalType": "uint8",
                  "name": "rewardTokenDecimals",
                  "type": "uint8"
                },
                {
                  "internalType": "uint8",
                  "name": "precision",
                  "type": "uint8"
                }
              ],
              "internalType": "struct IUiIncentiveDataProvider.IncentiveData",
              "name": "vIncentiveData",
              "type": "tuple"
            },
            {
              "components": [
                {
                  "internalType": "uint256",
                  "name": "emissionPerSecond",
                  "type": "uint256"
                },
                {
                  "internalType": "uint256",
                  "name": "incentivesLastUpdateTimestamp",
                  "type": "uint256"
                },
                {
                  "internalType": "uint256",
                  "name": "tokenIncentivesIndex",
                  "type": "uint256"
                },
                {
                  "internalType": "uint256",
                  "name": "emissionEndTimestamp",
                  "type": "uint256"
                },
                {
                  "internalType": "address",
                  "name": "tokenAddress",
                  "type": "address"
                },
                {
                  "internalType": "address",
                  "name": "rewardTokenAddress",
                  "type": "address"
                },
                {
                  "internalType": "address",
                  "name": "incentiveControllerAddress",
                  "type": "address"
                },
                {
                  "internalType": "uint8",
                  "name": "rewardTokenDecimals",
                  "type": "uint8"
                },
                {
                  "internalType": "uint8",
                  "name": "precision",
                  "type": "uint8"
                }
              ],
              "internalType": "struct IUiIncentiveDataProvider.IncentiveData",
              "name": "sIncentiveData",
              "type": "tuple"
            }
          ],
          "internalType": "struct IUiIncentiveDataProvider.AggregatedReserveIncentiveData[]",
          "name": "",
          "type": "tuple[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "contract ILendingPoolAddressesProvider",
          "name": "provider",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "user",
          "type": "address"
        }
      ],
      "name": "getUserReservesIncentivesData",
      "outputs": [
        {
          "components": [
            {
              "internalType": "address",
              "name": "underlyingAsset",
              "type": "address"
            },
            {
              "components": [
                {
                  "internalType": "uint256",
                  "name": "tokenincentivesUserIndex",
                  "type": "uint256"
                },
                {
                  "internalType": "uint256",
                  "name": "userUnclaimedRewards",
                  "type": "uint256"
                },
                {
                  "internalType": "address",
                  "name": "tokenAddress",
                  "type": "address"
                },
                {
                  "internalType": "address",
                  "name": "rewardTokenAddress",
                  "type": "address"
                },
                {
                  "internalType": "address",
                  "name": "incentiveControllerAddress",
                  "type": "address"
                },
                {
                  "internalType": "uint8",
                  "name": "rewardTokenDecimals",
                  "type": "uint8"
                }
              ],
              "internalType": "struct IUiIncentiveDataProvider.UserIncentiveData",
              "name": "aTokenIncentivesUserData",
              "type": "tuple"
            },
            {
              "components": [
                {
                  "internalType": "uint256",
                  "name": "tokenincentivesUserIndex",
                  "type": "uint256"
                },
                {
                  "internalType": "uint256",
                  "name": "userUnclaimedRewards",
                  "type": "uint256"
                },
                {
                  "internalType": "address",
                  "name": "tokenAddress",
                  "type": "address"
                },
                {
                  "internalType": "address",
                  "name": "rewardTokenAddress",
                  "type": "address"
                },
                {
                  "internalType": "address",
                  "name": "incentiveControllerAddress",
                  "type": "address"
                },
                {
                  "internalType": "uint8",
                  "name": "rewardTokenDecimals",
                  "type": "uint8"
                }
              ],
              "internalType": "struct IUiIncentiveDataProvider.UserIncentiveData",
              "name": "vTokenIncentivesUserData",
              "type": "tuple"
            },
            {
              "components": [
                {
                  "internalType": "uint256",
                  "name": "tokenincentivesUserIndex",
                  "type": "uint256"
                },
                {
                  "internalType": "uint256",
                  "name": "userUnclaimedRewards",
                  "type": "uint256"
                },
                {
                  "internalType": "address",
                  "name": "tokenAddress",
                  "type": "address"
                },
                {
                  "internalType": "address",
                  "name": "rewardTokenAddress",
                  "type": "address"
                },
                {
                  "internalType": "address",
                  "name": "incentiveControllerAddress",
                  "type": "address"
                },
                {
                  "internalType": "uint8",
                  "name": "rewardTokenDecimals",
                  "type": "uint8"
                }
              ],
              "internalType": "struct IUiIncentiveDataProvider.UserIncentiveData",
              "name": "sTokenIncentivesUserData",
              "type": "tuple"
            }
          ],
          "internalType": "struct IUiIncentiveDataProvider.UserReserveIncentiveData[]",
          "name": "",
          "type": "tuple[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ];

  // Fetch and format reserve incentive data from UiIncentiveDataProvider contract
  const fetchReserveIncentiveData = async (
    lendingPoolAddressProvider: string,
    incentiveDataProviderAddress: string
  ) => {
    console.log(chainId);
    const provider = getProvider(chainId);
    console.log(provider);
    const incentiveDataProviderContract = new UiIncentiveDataProvider({
      incentiveDataProviderAddress,
      provider,
    });

    const idpc = new ethers.Contract("0xCA1Adb4164CEdB5E22DE41482c84B9293C614ffF", abi, provider);
    console.log(await idpc.getReservesIncentivesData("0x0d2087036a228D62024a30eCd1091EB800564Be6"));

    console.log(incentiveDataProviderAddress, lendingPoolAddressProvider);

    try {
      const rawReserveIncentiveData =
        await incentiveDataProviderContract.getIncentivesDataWithPrice({
          lendingPoolAddressProvider,
          quote: networkConfig.usdMarket ? Denominations.usd : Denominations.eth,
          chainlinkFeedsRegistry: networkConfig.addresses.chainlinkFeedRegistry,
        });
      setReserveIncentiveData(rawReserveIncentiveData);
      setErrorReserveIncentives(false);
    } catch (e) {
      console.log('e', e);
      setErrorReserveIncentives(e.message);
    }
    setLoadingReserveIncentives(false);
  };

  // Fetch and format user incentive data from UiIncentiveDataProvider
  const fetchUserIncentiveData = async (
    currentAccount: string,
    lendingPoolAddressProvider: string,
    incentiveDataProviderAddress: string
  ) => {
    const provider = getProvider(chainId);
    const incentiveDataProviderContract = new UiIncentiveDataProvider({
      incentiveDataProviderAddress,
      provider,
    });

    try {
      const rawUserIncentiveData: UserReserveIncentiveDataHumanizedResponse[] =
        await incentiveDataProviderContract.getUserReservesIncentivesDataHumanized(
          currentAccount,
          lendingPoolAddressProvider
        );

      setUserIncentiveData(rawUserIncentiveData);
      setErrorUserIncentives(false);
    } catch (e) {
      console.log('e', e);
      setErrorUserIncentives(e.message);
    }
    setLoadingUserIncentives(false);
  };

  useEffect(() => {
    setLoadingReserveIncentives(true);
    setLoadingUserIncentives(true);

    if (!skip && incentiveDataProviderAddress) {
      fetchData(currentAccount, lendingPoolAddressProvider, incentiveDataProviderAddress);
      const intervalID = setInterval(
        () => fetchData(currentAccount, lendingPoolAddressProvider, incentiveDataProviderAddress),
        errorReserveIncentives || errorUserIncentives ? RECOVER_INTERVAL : POOLING_INTERVAL
      );
      return () => clearInterval(intervalID);
    } else {
      setLoadingReserveIncentives(false);
      setLoadingUserIncentives(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAccount, lendingPoolAddressProvider, skip]);

  const loading = loadingReserveIncentives || loadingUserIncentives;
  const error = errorReserveIncentives || errorUserIncentives;
  return {
    loading,
    error,
    data: { reserveIncentiveData, userIncentiveData },
    refresh: async () => {
      if (incentiveDataProviderAddress)
        return fetchData(currentAccount, lendingPoolAddressProvider, incentiveDataProviderAddress);
    },
  };
}
