(function () {
  'use strict';

  const animationDefaults = { duration: 0.6, ease: 'expo' };

  function distMetric(x, y, x2, y2) {
    const xDiff = x - x2;
    const yDiff = y - y2;
    return xDiff * xDiff + yDiff * yDiff;
  }

  function findClosestEdge(mouseX, mouseY, width, height) {
    const topEdgeDist = distMetric(mouseX, mouseY, width / 2, 0);
    const bottomEdgeDist = distMetric(mouseX, mouseY, width / 2, height);
    return topEdgeDist < bottomEdgeDist ? 'top' : 'bottom';
  }

  window.initFlowingMenuItem = function (itemEl, options = {}) {
    if (typeof gsap === 'undefined') return;

    const speed = options.speed || 15;
    const marquee = itemEl.querySelector('.marquee');
    const marqueeInner = itemEl.querySelector('.marquee__inner');
    if (!marquee || !marqueeInner) return;

    const marqueePart = marqueeInner.querySelector('.marquee__part');
    if (!marqueePart) return;

    // Small delay to ensure measurements are accurate
    requestAnimationFrame(() => {
      const contentWidth = marqueePart.offsetWidth || 200;
      gsap.to(marqueeInner, {
        x: -contentWidth,
        duration: speed,
        ease: 'none',
        repeat: -1
      });
    });

    itemEl.addEventListener('mouseenter', function (ev) {
      const rect = itemEl.getBoundingClientRect();
      const x = ev.clientX - rect.left;
      const y = ev.clientY - rect.top;
      const edge = findClosestEdge(x, y, rect.width, rect.height);

      gsap.timeline({ defaults: animationDefaults })
        .set(marquee, { y: edge === 'top' ? '-101%' : '101%' }, 0)
        .set(marqueeInner, { y: edge === 'top' ? '101%' : '-101%' }, 0)
        .to([marquee, marqueeInner], { y: '0%' }, 0);
    });

    itemEl.addEventListener('mouseleave', function (ev) {
      const rect = itemEl.getBoundingClientRect();
      const x = ev.clientX - rect.left;
      const y = ev.clientY - rect.top;
      const edge = findClosestEdge(x, y, rect.width, rect.height);

      gsap.timeline({ defaults: animationDefaults })
        .to(marquee, { y: edge === 'top' ? '-101%' : '101%' }, 0)
        .to(marqueeInner, { y: edge === 'top' ? '101%' : '-101%' }, 0);
    });
  };
})();
