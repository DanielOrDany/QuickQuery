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
            fullName: "",
            companyName: "",
            registerEmail: "",
            registerPassword: "",
            isError: false,
            isLogin: true
        };
    };

    componentDidMount() {}

    async login() {
        const { email, password } = this.state;
        const result = await this.props.onLogin(email, password);

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
        const { registerEmail, registerPassword, fullName, companyName } = this.state;

        const result = await this.props.onRegister(registerEmail, registerPassword, fullName, companyName);
        console.log('fff', result);
        if (result) {
            if(result.error) {
                this.setState({error: result.error, isError: true});
            }
            else {
                this.setState({isError: false});
            }
        }
    }

    async openRegister() {
        this.setState({
            isLogin: false
        });

        // const shell = window.electron.shell;
        // await shell.openExternal("https://app.quickquery.co/sign-up");
    }

    async openLogin() {
        this.setState({
            isLogin: true
        });

        // const shell = window.electron.shell;
        // await shell.openExternal("https://app.quickquery.co/sign-up");
    }

    render() {
        const {
            email,
            password,
            error,
            isError,
            isLogin,
            fullName,
            companyName,
            registerEmail,
            registerPassword
        } = this.state;

        return(
            <div className="auth-page">

                { isLogin &&
                    <div className="auth-form">
                        <div className="auth-form-header-image">
                            <img src={appIcon}/>
                        </div>
                        <div className="auth-form-header">
                            <div className="auth-form-header-text">
                                <span className="auth-form-title">Sign In</span>
                            </div>
                            <div>
                                <div className='auth-form-register-button' onClick={() => this.openRegister()}>
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
                }

                { !isLogin &&
                    <div className="auth-form">
                        <div className="auth-form-header-image">
                            <img src={appIcon}/>
                        </div>
                        <div className="auth-form-header">
                            <div className="auth-form-header-text">
                                <span className="auth-form-title">Sign Up</span>
                            </div>
                            <div>
                                <div className='auth-form-register-button' onClick={() => this.openLogin()}>
                                    <b>Login</b> instead?
                                </div>
                            </div>
                        </div>

                        <div className="auth-form-input-item">
                            <div className="auth-form-input-label"><span>Full Name</span></div>
                            <input id="login-password" value={fullName}
                                   onChange={event => this.setState({ fullName: event.target.value })}/>
                        </div>

                        <div className="auth-form-input-item">
                            <div className="auth-form-input-label"><span>Email</span></div>
                            <input id="login-email" value={registerEmail}
                                   onChange={event => this.setState({ registerEmail: event.target.value })}/>
                        </div>

                        <div className="auth-form-input-item">
                            <div className="auth-form-input-label"><span>Company Name</span></div>
                            <input id="login-password" value={companyName}
                                   onChange={event => this.setState({ companyName: event.target.value })}/>
                        </div>


                        <div className="auth-form-input-item">
                            <div className="auth-form-input-label"><span>Password</span></div>
                            <input id="login-password" type="password" value={registerPassword}
                                   onChange={event => this.setState({ registerPassword: event.target.value })}/>
                            <div className="auth-form-input-tip">At least 8 characters</div>
                        </div>

                        { error &&
                        <div className="auth-form-error"><span>{error}</span></div>
                        }

                        <div className="auth-form-buttons">
                            {/*<button id="auth-form-cancel-button" className='auth-form-register-button' onClick={() => this.register()}>Register</button>*/}
                            <button id="auth-form-login-button" className='auth-form-login-button' onClick={() => this.register()}>Create Account</button>
                        </div>
                    </div>
                }


                <div className="blur-back"></div>
            </div>
        );
    }
}
