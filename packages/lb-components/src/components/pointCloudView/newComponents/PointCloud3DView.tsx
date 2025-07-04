/*
 * @Author: Laoluo luozefeng@sensetime.com
 * @Date: 2022-06-13 19:31:36
 * @LastEditors: Laoluo luozefeng@sensetime.com
 * @LastEditTime: 2022-06-27 19:43:25
 */

import { getClassName } from '@/utils/dom';
import { PerspectiveViewer } from '@labelbee/lb-annotation';
import { EPerspectiveView, PointCloudUtils, toolStyleConverter } from '@labelbee/lb-utils';
import classNames from 'classnames';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { PointCloudContainer } from '../PointCloudLayout';
import { a2MapStateToProps, IA2MapStateProps } from '@/store/annotation/map';
import { connect } from 'react-redux';
import { Switch, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import { LabelBeeContext } from '@/store/ctx';
import PointCloudSizeSlider from '../components/PointCloudSizeSlider';
import TitleButton from '../components/TitleButton';
import { LeftOutlined } from '@ant-design/icons';
import { PointCloudContext } from '../PointCloudContext';

const pointCloudID = 'LABELBEE-POINTCLOUD';
const PointCloud3DContext = React.createContext<{
  isActive: boolean;
  setTarget3DView: (perspectiveView: EPerspectiveView) => void;
  reset3DView: () => void;
  followTopView: () => void;
}>({
  isActive: false,
  setTarget3DView: () => {},
  reset3DView: () => {},
  followTopView: () => {},
});

const PointCloudViewIcon = ({
  perspectiveView,
}: {
  perspectiveView: keyof typeof EPerspectiveView;
}) => {
  const { isActive, setTarget3DView } = useContext(PointCloud3DContext);

  const getTarget3DViewClassName = (position: string) => {
    return classNames({
      [getClassName('point-cloud-3d-view', position)]: true,
      active: isActive,
    });
  };

  return (
    <span
      onClick={() => {
        setTarget3DView(EPerspectiveView[perspectiveView]);
      }}
      className={getTarget3DViewClassName(perspectiveView.toLocaleLowerCase())}
    />
  );
};

const PointCloud3DSideBar = ({ isEnlarge }: { isEnlarge?: boolean }) => {
  const { reset3DView, followTopView } = useContext(PointCloud3DContext);
  const { t } = useTranslation();

  const viewIconList = (
    <>
      <PointCloudViewIcon perspectiveView='Top' />
      <PointCloudViewIcon perspectiveView='Front' />
      <PointCloudViewIcon perspectiveView='Left' />
      <PointCloudViewIcon perspectiveView='Back' />
      <PointCloudViewIcon perspectiveView='Right' />
      <PointCloudViewIcon perspectiveView='LFT' />
      <PointCloudViewIcon perspectiveView='RBT' />
    </>
  );
  const localizeIcon = (
    <>
      <Tooltip title={t('CameraFollowTopView')}>
        <span
          onClick={() => {
            followTopView();
          }}
          className={getClassName('point-cloud-3d-view', 'followTop')}
        />
      </Tooltip>

      <span
        onClick={() => {
          reset3DView();
        }}
        className={getClassName('point-cloud-3d-view', 'reset')}
      />
    </>
  );

  if (isEnlarge) {
    return (
      <div className={getClassName('point-cloud-3d-sidebarZoom')}>
        {localizeIcon}
        {viewIconList}
      </div>
    );
  }
  return (
    <div className={getClassName('point-cloud-3d-sidebar')}>
      {viewIconList}
      {localizeIcon}
    </div>
  );
};
const PointCloud3D: React.FC<IA2MapStateProps> = ({
  currentData,
  config,
  highlightAttribute,
  setResourceLoading,
}) => {
  const [showDirection, setShowDirection] = useState(true);
  const [isEnlarge, setIsEnlarge] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { t } = useTranslation();

  const { shareScene } = useContext(PointCloudContext);

  const viewer = useRef<PerspectiveViewer>();
  useEffect(() => {
    if (ref.current) {
      viewer.current = new PerspectiveViewer(ref.current, shareScene, { name: '3D' });
    }
    return () => {
      viewer.current?.dispose();
    };
  }, []);

  const PointCloud3DTitle = (
    <>
      <PointCloudSizeSlider
        onChange={(v: number) => {
          console.log('v', v);
        }}
      />
      <span style={{ marginRight: 8 }}>{t('ShowArrows')}</span>
      <Switch
        size='small'
        checked={showDirection}
        onChange={(showDirection) => {
          setShowDirection(showDirection);
          console.log('showDirection', showDirection);
        }}
      />
      {isEnlarge && <PointCloud3DSideBar isEnlarge={isEnlarge} />}
    </>
  );

  return (
    <PointCloudContainer
      className={classNames({
        [getClassName('point-cloud-3d-container')]: true,
        [getClassName('point-cloud-container', 'zoom')]: isEnlarge,
      })}
      title={
        isEnlarge ? (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <LeftOutlined
              style={{ cursor: 'pointer', marginRight: '12px' }}
              onClick={() => {
                setIsEnlarge(false);
              }}
            />
            {t('3DView')}
          </div>
        ) : (
          <TitleButton
            title={t('3DView')}
            onClick={() => {
              setIsEnlarge(true);
            }}
          />
        )
      }
      toolbar={PointCloud3DTitle}
    >
      <div className={getClassName('point-cloud-3d-content')}>
        {!isEnlarge && <PointCloud3DSideBar />}
        <div className={getClassName('point-cloud-3d-view')} id={pointCloudID} ref={ref} />
      </div>
    </PointCloudContainer>
  );
};

export default connect(a2MapStateToProps, null, null, { context: LabelBeeContext })(PointCloud3D);
