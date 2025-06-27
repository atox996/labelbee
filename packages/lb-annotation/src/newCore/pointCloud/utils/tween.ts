import TWEEN, { Tween } from 'three/examples/jsm/libs/tween.module.js';

interface TweenOptions<T extends EmptyObject> {
  from: T;
  to: T;
  duration?: number;
  onUpdate?: (object: T, elapsed: number) => void;
  onComplete?: (object: T) => void;
}

export function createTween<T extends EmptyObject = EmptyObject>() {
  let tween: Tween<T> | null = null;

  const animate = (time?: number) => {
    if (tween) {
      tween.update(time);
      requestAnimationFrame(animate);
    }
  };

  const stop = () => {
    if (tween) tween.stop();
    tween = null;
  };

  const start = <TT extends T>(options: TweenOptions<TT>) => {
    stop();
    tween = new TWEEN.Tween(options.from)
      .to(options.to, options.duration)
      .onUpdate((object, elapsed) => {
        options.onUpdate?.(object, elapsed);
      })
      .onComplete((object) => {
        options.onComplete?.(object);
        stop();
      })
      .start();

    animate();
  };

  return {
    start,
    stop,
  };
}
