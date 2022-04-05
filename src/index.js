import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './react/App';
import * as serviceWorker from './serviceWorker';
import mixpanel from 'mixpanel-browser';

mixpanel.init('5d0a2402c8cb46140f0d604532212f85', { debug: true });

ReactDOM.render(<App/>, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA

serviceWorker.unregister();
