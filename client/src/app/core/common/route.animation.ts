import { animate, state, style, transition, trigger } from '@angular/animations';

/*
Deprecated until Opacity works again

export let routeAnimation = trigger('routeAnimation', [
  transition('void => *', [
    style({
      transform: 'translate3d(0, 10%, 0)',
      opacity: 0,
    }),
    group([
      animate('400ms ease-in-out', style({
        //transform: 'translate3d(0, 0, 0)',
        transform: 'translate3d(0, 0, 0)',
        opacity: 1,
      })),
      animate('400ms 150ms ease-in-out', style({
        opacity: 1,
      }))
    ]),
  ]),
]);
*/

export let routeAnimation = trigger('routeAnimation', [
  transition('void => *', [
    style({
      opacity: 0,
    }),
    animate('400ms 150ms ease-in-out', style({
      opacity: 1,
    }))
  ]),
]);


export let fadeOutAnimation = trigger('fadeOutAnimation', [
  state('*', style({
    position: 'absolute',
    'min-width': '100%',
    'min-height': '100%',
    'max-width': '100%',
    display: 'flex',
    'flex-direction': 'column',
    flex: '1',
    height: '100%'
  })),
  state('void', style({
    position: 'absolute',
    'min-width': '100%',
    'min-height': '100%',
    'max-width': '100%',
    display: 'flex',
    'flex-direction': 'column',
    flex: '1',
    height: '100%'
  })),
  transition('* => void', [
    style({
      opacity: 1,
    }),
    animate('150ms linear', style({
      opacity: 0,
    }))
  ]),
]);
