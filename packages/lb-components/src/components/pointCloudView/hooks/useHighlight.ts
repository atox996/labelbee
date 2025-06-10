/**
 * @file Save the highlight Info.
 * @createDate 2023-08-08
 * @author Ron <ron.f.luo@gmail.com>
 */

import { useCallback, useContext } from 'react';
import { PointCloudContext } from '../PointCloudContext';
import { IAnnotationStateProps } from '../../../store/annotation/map';
import { ICalib } from '@labelbee/lb-utils';
import { ImgUtils } from '@labelbee/lb-annotation';

const useHighlight = ({ currentData }: Partial<IAnnotationStateProps>) => {
  const {
    mainViewInstance,
    topViewInstance,
    pointCloudBoxList,
    highlight2DDataList,
    setHighlight2DDataList,
  } = useContext(PointCloudContext);
  const mappingImgList = currentData?.mappingImgList ?? [];

  const toggle2dVisible = async (url: string, fallbackUrl: string, calib?: ICalib) => {
    let newHighlightList: Array<{ url: string; fallbackUrl: string; calib?: ICalib }> = [
      ...highlight2DDataList,
    ];

    // Update highlight Status.
    if (highlight2DDataList.find((v) => v.url === url)) {
      newHighlightList = highlight2DDataList.filter((v) => v.url !== url);
      mainViewInstance?.updateCameraRegionMatrix();
      topViewInstance?.pointCloudInstance.updateCameraRegionMatrix();
    } else {
      newHighlightList.push({
        url,
        fallbackUrl,
        calib,
      });
      const imgNode = await ImgUtils.load(url);
      const imageSize = {
        width: imgNode.width,
        height: imgNode.height,
      }
      mainViewInstance?.updateCameraRegionMatrix(calib, imageSize);
      topViewInstance?.pointCloudInstance.updateCameraRegionMatrix(calib, imageSize);
    }
    console.log('calib', calib);

    setHighlight2DDataList(newHighlightList);

    // if (!mainViewInstance || mappingImgList?.length === 0) {
    //   return;
    // }

    // const points = mainViewInstance.pointCloudObject;
    // if (!points) {
    //   return;
    // }

    // const highlightIndex = await mainViewInstance.getHighlightIndexByMappingImgList({
    //   mappingImgList: newHighlightList,
    //   points: points.geometry.attributes.position.array,
    // });

    // try {
    //   const colorInfo = await mainViewInstance.highlightOriginPointCloud(
    //     pointCloudBoxList,
    //     highlightIndex,
    //   );
    //   const { color } = colorInfo ?? {};
    //   // color && topViewInstance?.pointCloudInstance?.updateColor(color);
    //   topViewInstance?.pointCloudInstance?.updateColor(pointCloudBoxList)
    // } catch (error) {
    //   console.error('toggle2dVisible highlightOriginPointCloud error:', error);
    // }
  };

  const isHighlightVisible = useCallback(
    (url: string) => {
      return highlight2DDataList.findIndex((v) => v.url === url) >= 0;
    },
    [highlight2DDataList],
  );

  return {
    toggle2dVisible,
    isHighlightVisible,
  };
};

export { useHighlight };
