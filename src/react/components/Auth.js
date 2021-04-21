import React from 'react';
import '../styles/Auth.scss';

export default class Auth extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            email: "",
            password: "",
            error: ""
        };
    };

    componentDidMount() {}

    async login() {
        const { email, password } = this.state;
        const result = await this.props.onLogin(email, password);
        console.log(result);
        if (result) {
            if(result.error) {
                this.setState({error: result.error});
            }
        }
    }

    render() {
        const { email, password, error } = this.state;

        return(
            <div className="auth-page">
                <div className="login-form">
                    <span className="form-title">Login as employee</span>

                    <input placeholder="Email" id="login-email" value={email}
                           onChange={event => this.setState({ email: event.target.value })}/>

                    <input placeholder="Password" id="login-password" type="password" value={password}
                           onChange={event => this.setState({ password: event.target.value })}/>

                    <span className="error">{error}</span>

                    <button onClick={() => this.login()}>SIGN IN</button>
                </div>
                <div className="blur-back"/>
            </div>
        );
    }
}
