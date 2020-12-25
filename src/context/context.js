import React, {useState, useEffect} from 'react';
import mockUser from './mockData.js/mockUser';
import mockRepos from './mockData.js/mockRepos';
import mockFollowers from './mockData.js/mockFollowers';
import axios from 'axios';

const rootUrl = 'https://api.github.com';

const GithubContext = React.createContext();

const GithubProvider = ({children}) => {
    const [githubUser, setGithubUser] = useState(mockUser);
    const [repos, setRepos] = useState(mockRepos);
    const [followers, setFollowers] = useState(mockFollowers);

    const [requests, setRequests] = useState(0);// koliko ima zahteva
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState({show: false, msg: ''});

    const checkRequests = () => {
        axios.get(`${rootUrl}/rate_limit`).then(({data}) => {
            let {rate: {remaining}} = data;
            setRequests(remaining);
            if (remaining === 0) {
                toggleError(true, 'Sorry, you have exeeded your hourly rate limit');
            } else {

            }
        }).catch((err) => console.log(err));
    }

    const searchGithubUser = async (user) => {
        toggleError();
        setLoading(true)
        const response = await axios.get(`${rootUrl}/users/${user}`).catch(err => console.log(err));
        if (response) {
            setGithubUser(response.data);
            const {login, followers_url, repos_url} = response.data;
            await Promise.allSettled([axios(`${repos_url}?per_page=100`),
                axios(`${followers_url}?per_page=100`)])
                .then((results) => {
                    const [respos, followers] = results
                    const status = 'fulfilled';
                    if (respos.status === status) {
                        setRepos(respos.value.data);
                    }
                    if (followers.status === status) {
                        setFollowers(followers.value.data);
                    }
                }).catch(error => console.log(error));
        } else {
            toggleError(true, "Ne postoji user sa tim imenom");
        }

        checkRequests();
        setLoading(false);

    }

    function toggleError(show = false, msg = '') {
        setError({show, msg});
    }

    useEffect(() => {
        checkRequests();
    }, [])

    return <GithubContext.Provider
        value={{
            setGithubUser,
            githubUser,
            repos,
            followers,
            requests,
            error,
            searchGithubUser,
            loading
        }}>{children}</GithubContext.Provider>
}


export {GithubProvider, GithubContext}