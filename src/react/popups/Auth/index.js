import React from 'react';
import './Auth.scss';
import appIcon from '../../icons/logo.svg';

export default class AuthPopup extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            email: "",
            password: "",
            error: "",
            isError: false
        };
    };

    componentDidMount() {}

    async login() {
        const { email, password } = this.state;
        const result = await this.props.onLogin(email, password);
        console.log(result);
        if (result) {
            if(result.error) {
                this.setState({error: result.error, isError: true});
            }
            else {
                this.setState({isError: false});
            }
        }

    }

    async register() {
        const shell = window.electron.shell;
        await shell.openExternal("https://app.quickquery.co/sign-up");
    }

    render() {
        const { email, password, error, isError } = this.state;

        return(
            <div className="auth-page">

                <div className="auth-form">
                    <div className="auth-form-header-image">
                        <img src={appIcon}/>
                    </div>
                    <div className="auth-form-header">
                        <div className="auth-form-header-text">
                            <span className="auth-form-title">Sign In</span>
                        </div>
                        <div>
                            <div className='auth-form-register-button' onClick={() => this.register()}>
                                <b>Create Account</b> instead?
                            </div>
                        </div>
                    </div>

                    <div className="auth-form-input-item">
                        <div className="auth-form-input-label"><span>Email</span></div>
                        <input id="login-email" value={email}
                               onChange={event => this.setState({ email: event.target.value })}/>
                    </div>

                    <div className="auth-form-input-item">
                        <div className="auth-form-input-label"><span>Password</span></div>
                        <input id="login-password" type="password" value={password}
                               onChange={event => this.setState({ password: event.target.value })}/>
                    </div>

                    { error &&
                        <div className="auth-form-error"><span>{error}</span></div>
                    }

                    <div className="auth-form-buttons">
                        {/*<button id="auth-form-cancel-button" className='auth-form-register-button' onClick={() => this.register()}>Register</button>*/}
                        <button id="auth-form-login-button" className='auth-form-login-button' onClick={() => this.login()}>Login</button>
                    </div>
                </div>
                <div className="blur-back"></div>
            </div>
        );
    }
}
