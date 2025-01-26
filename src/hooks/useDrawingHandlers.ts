import { useState, useCallback, useRef } from 'react';
import { useMochipadStore } from '../stores/mochipadStore';

// DrawingHandlersProps 인터페이스 정의
// 스페이스바 상태를 전달받아 그리기와 화면 이동 모드를 구분하기 위해 필요
// 화면 이동 모드일 때는 그리기 기능을 비활성화해야 함
interface DrawingHandlersProps {
  isSpacePressed?: boolean;
}

export function useDrawingHandlers({ isSpacePressed }: DrawingHandlersProps = {}) {
  // 그리기 관련 상태값들을 useState로 관리
  // 이 상태들은 실시간 그리기 작업에 필요한 정보를 추적하고 관리
  const [isDrawing, setIsDrawing] = useState(false);          // 현재 마우스를 누른 상태로 그리기 중인지 여부
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);  // 연속된 선을 그리기 위해 이전 점의 좌표를 저장
  const [isMouseInCanvas, setIsMouseInCanvas] = useState(false);  // 마우스가 캔버스를 벗어났을 때 그리기를 중단하기 위한 상태
  
  // useRef를 사용하여 렌더링과 무관하게 그리기 시작 상태를 추적
  // 불필요한 렌더링을 방지하고 그리기 시작 시점을 정확히 파악하기 위해 사용
  const drawingStarted = useRef(false);

  // Zustand 스토어에서 캔버스 설정과 브러시 설정을 가져옴
  // 이 값들은 실제 그리기 작업에 사용되는 기본 설정들
  const {
    canvasWidth,      // 실제 캔버스의 너비 (CSS 크기와 다를 수 있음)
    canvasHeight,     // 실제 캔버스의 높이 (CSS 크기와 다를 수 있음)
    brushColor,       // 현재 선택된 브러시 색상 (RGB 또는 RGBA 값)
    brushSize,        // 브러시의 두께 (픽셀 단위)
    brushOpacity,     // 브러시의 투명도 (0~1 사이의 값)
  } = useMochipadStore();

  // 화면상의 마우스 좌표를 캔버스 내부 좌표로 변환하는 함수
  // 캔버스가 화면에서 실제 표시되는 크기와 내부 해상도가 다르기 때문에 필요
  // 이 변환 과정이 없으면 그리기 위치가 마우스 포인터와 일치하지 않음
  const getCanvasPoint = useCallback((clientX: number, clientY: number, drawableRect: DOMRect) => {
    // 캔버스 요소의 위치를 기준으로 상대적인 마우스 위치 계산
    // clientX/Y는 브라우저 창 기준 좌표, drawableRect.left/top을 빼서 캔버스 기준 좌표로 변환
    const relativeX = clientX - drawableRect.left;
    const relativeY = clientY - drawableRect.top;
    
    // 화면에 표시되는 캔버스 크기와 실제 캔버스 해상도의 비율 계산
    // 이 비율을 사용하여 화면 좌표를 실제 캔버스 좌표로 변환
    const displayToCanvasRatio = canvasWidth / drawableRect.width;

    // 계산된 좌표가 캔버스 영역을 벗어나지 않도록 제한하여 반환
    // Math.max와 Math.min을 사용하여 좌표값을 캔버스 크기 범위 내로 제한
    return {
      x: Math.max(0, Math.min(canvasWidth, relativeX * displayToCanvasRatio)),
      y: Math.max(0, Math.min(canvasHeight, relativeY * displayToCanvasRatio))
    };
  }, [canvasWidth, canvasHeight]);

  // 마우스 버튼을 눌렀을 때 호출되는 이벤트 핸들러
  // 그리기 작업의 시작점을 설정하고 필요한 상태들을 초기화
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    // 스페이스바가 눌려있거나 왼쪽 마우스가 아닌 경우 그리기 시작하지 않음
    // 이는 화면 이동 모드일 때 실수로 그리는 것을 방지하고
    // 오직 왼쪽 마우스 버튼으로만 그리기가 가능하도록 제한
    if (isSpacePressed) return;
    if (e.button !== 0) return;
    
    // 현재 활성화된 레이어 정보를 가져와서 그리기가 가능한 상태인지 확인
    // 레이어가 보이지 않거나 오프스크린 컨텍스트가 없으면 그리기 불가
    const store = useMochipadStore.getState();
    const activeLayer = store.getActiveLayer();
    if (!activeLayer?.visible || !store.offscreenContext) return;

    console.log('Started drawing on offscreen canvas');
    drawingStarted.current = true;
    
    // 마우스가 눌린 위치를 캔버스 좌표로 변환
    // 이 좌표는 실제 그리기가 시작되는 지점
    const drawableRect = e.currentTarget.getBoundingClientRect();
    const point = getCanvasPoint(e.clientX, e.clientY, drawableRect);
    
    // 그리기 상태를 활성화하고 시작점을 저장
    // 이 정보는 마우스 이동 시 연속된 선을 그리는데 사용됨
    setIsDrawing(true);
    setLastPoint(point);

    // 오프스크린 캔버스와 화면에 표시되는 임시 캔버스 모두에 그리기 설정
    // 오프스크린 캔버스는 최종 결과물을 저장하고
    // 화면의 임시 캔버스는 실시간으로 그리기 과정을 보여줌
    const context = store.offscreenContext;
    const displayContext = (e.currentTarget.parentElement?.querySelector('.offscreen-canvas') as HTMLCanvasElement)?.getContext('2d');
    
    // 두 캔버스 모두에 동일한 브러시 설정을 적용
    // 이렇게 함으로써 실시간 미리보기와 최종 결과물이 동일하게 표시됨
    [context, displayContext].forEach(ctx => {
      if (!ctx) return;
      ctx.beginPath();                    // 새로운 선 그리기를 시작
      ctx.moveTo(point.x, point.y);       // 펜을 시작점으로 이동
      ctx.strokeStyle = brushColor;        // 선의 색상 설정
      ctx.lineWidth = brushSize;          // 선의 두께 설정
      ctx.lineCap = 'round';              // 선의 끝을 둥글게 처리
      ctx.lineJoin = 'round';             // 선이 꺾이는 부분을 둥글게 처리
      ctx.globalAlpha = 1;                // 선의 투명도를 불투명하게 설정
    });
    
  }, [brushColor, brushSize, brushOpacity, isSpacePressed]);

  // 마우스 이동 시 호출되는 이벤트 핸들러
  // 이전 점과 현재 점 사이에 선을 그려 연속된 선을 만듦
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    // 그리기가 불가능한 상태면 종시 종료
    // 스페이스바가 눌렸거나, 그리기 중이 아니거나, 
    // 이전 점이 없거나, 마우스가 캔버스를 벗어난 경우
    if (isSpacePressed) return;
    if (!isDrawing || !lastPoint || !isMouseInCanvas) return;

    // 현재 레이어 상태 확인
    const store = useMochipadStore.getState();
    const activeLayer = store.getActiveLayer();
    if (!activeLayer?.visible || !store.offscreenContext) return;

    // 실제 그리기 시작 플래그를 해제
    // 이는 첫 번째 점을 찍은 후에만 실행됨
    if (drawingStarted.current) {
      drawingStarted.current = false;
    }

    // 현재 마우스 위치를 캔버스 좌표로 변환
    const drawableRect = e.currentTarget.getBoundingClientRect();
    const point = getCanvasPoint(e.clientX, e.clientY, drawableRect);

    // 오프스크린 캔버스와 화면 캔버스 모두에 선 그리기
    // 두 캔버스를 동시에 업데이트하여 실시간으로 그리기 과정을 표시
    const context = store.offscreenContext;
    const displayContext = (e.currentTarget.parentElement?.querySelector('.offscreen-canvas') as HTMLCanvasElement)?.getContext('2d');
    
    [context, displayContext].forEach(ctx => {
      if (!ctx) return;
      ctx.lineTo(point.x, point.y);   // 이전 점에서 현재 점까지 선을 그림
      ctx.stroke();                    // 실제로 선을 캔버스에 그림
      ctx.beginPath();                 // 다음 선 그리기를 위해 새로운 패스 시작
      ctx.moveTo(point.x, point.y);    // 다음 선의 시작점을 현재 점으로 설정
    });

    // 다음 이동을 위해 현재 점을 마지막 점으로 저장
    setLastPoint(point);
  }, [isDrawing, lastPoint, isMouseInCanvas, isSpacePressed]);

  // 마우스 버튼을 뗐을 때 호출되는 이벤트 핸들러
  // 현재까지 그린 내용을 실제 레이어에 적용하고 상태를 초기화
  const handleMouseUp = useCallback(() => {
    // 그리기가 불가능한 상태면 종료
    if (isSpacePressed) return;
    if (!isDrawing) return;

    const store = useMochipadStore.getState();
    const activeLayer = store.getActiveLayer();
    
    // 오프스크린 캔버스의 내용을 실제 레이어에 복사
    // 이 과정에서 브러시의 투명도가 적용됨
    if (activeLayer?.context && store.offscreenCanvas) {
      activeLayer.context.globalAlpha = brushOpacity;  // 최종 투명도 설정
      activeLayer.context.drawImage(store.offscreenCanvas, 0, 0);  // 그린 내용을 레이어에 복사
      console.log(`Copied drawing to layer: ${activeLayer.name}`);
      
      // 임시로 사용한 오프스크린 캔버스들을 초기화
      // 다음 그리기를 위해 깨끗한 상태로 만듦
      store.offscreenContext?.clearRect(0, 0, canvasWidth, canvasHeight);
      const displayCanvas = document.querySelector('.offscreen-canvas') as HTMLCanvasElement;
      const displayContext = displayCanvas?.getContext('2d');
      displayContext?.clearRect(0, 0, canvasWidth, canvasHeight);
      
      // 현재 상태를 히스토리에 저장하여 실행 취소/다시 실행이 가능하게 함
      store.saveHistory();
    }

    // 모든 그리기 관련 상태를 초기화
    // 다음 그리기 작업을 위해 초기 상태로 되돌림
    drawingStarted.current = false;
    setIsDrawing(false);
    setLastPoint(null);
  }, [isDrawing, canvasWidth, canvasHeight, brushOpacity, isSpacePressed]);

  // 외부 컴포넌트에서 사용할 상태와 핸들러들을 반환
  // 이 값들은 실제 캔버스 엘리먼트에 이벤트 리스너로 연결됨
  return {
    isDrawing,              // 현재 그리기 중인지 여부
    isMouseInCanvas,        // 마우스가 캔버스 영역 안에 있는지 여부
    setIsMouseInCanvas,     // 마우스의 캔버스 진입/이탈 상태를 설정하는 함수
    handleMouseDown,        // 마우스 버튼을 눌렀을 때의 이벤트 핸들러
    handleMouseMove,        // 마우스를 이동할 때의 이벤트 핸들러
    handleMouseUp,          // 마우스 버튼을 뗐을 때의 이벤트 핸들러
  };
}