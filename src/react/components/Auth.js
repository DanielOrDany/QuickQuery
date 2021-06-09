import React from 'react';
import '../styles/Auth.scss';

import form_logo from "../icons/login-form-logo.svg";

export default class Auth extends React.Component {
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

    render() {
        const { email, password, error, isError } = this.state;

        return(
            <div className="auth-page">


                <div className="login-form">
                    <div className={'login-form-header'}>
                        <span className="form-title">Login as employee</span>

                        <img src={form_logo} alt={'logo'}/>
                    </div>

                    <div className={'form-sub-title'}>
                        <span>Enter your account details to enter</span>
                    </div>



                    <div className={'login-form-email-input'}>
                        <span className={'login-form-input-title'}>Email</span>

                        <input className={'login-form-input'} placeholder="Enter email" id="login-email" value={email}
                               onChange={event => this.setState({ email: event.target.value })}/>
                    </div>



                    <div className={'login-form-password-input'}>
                        <span className={'login-form-input-title'}>Password</span>

                        <input className={'login-form-input'} placeholder="Enter password" id="login-password" type="password" value={password}
                               onChange={event => this.setState({ password: event.target.value })}/>
                    </div>





                    {isError ?


                        <div className={'login-form-footer-error'}>
                            <span className="error">{error}</span>

                            <button onClick={() => this.login()}>Login</button>
                        </div>
                        :
                        <div className={'login-form-footer'}>
                            <button onClick={() => this.login()}>Login</button>
                        </div>
                    }



                </div>


                <div className="blur-back"/>
            </div>
        );
    }
}
