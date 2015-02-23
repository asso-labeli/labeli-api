labeli-api
==========

Remote API for the Label[i] platform

Available functions
-------------------

Authentification :

    [GET]    /auth              Get currently logged user
    [POST]   /auth              Login (Parameters : username, password)
    [DELETE] /auth              Logout

Projects :

    [GET]    /projects          Get all the projects
    [POST]   /projects          Create a new project (Parameters : name, type, authorUsername)
    [GET]    /projects/:id      Get a project
    [POST]   /projects/:id      Edit a project (Parameters : name, type)

Users :

    [GET]    /users             Get all the users
    [POST]   /users             Create a new user (Parameters : firstName, lastName, email)
    [GET]    /users/:id         Get a user
    [POST]   /users/:id         Edit a user (Parameters : email, password)

Must be developped
------------------

Messages :

    [GET]    /messages/:thread  Get all the messages
    [POST]   /messages/:thread  Create a new message (Parameters : content)

Votes :

    [GET]    /votes/:thread     Get data about votes on a thread
    [POST]   /votes/:thread     Create or Update a vote on a thread