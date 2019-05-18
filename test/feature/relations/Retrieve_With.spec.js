import { createStore } from 'test/support/Helpers'
import Model from 'app/model/Model'

describe('Feature – Relations – Retrieve – With', () => {
  it('can resolve all relations', async () => {
    class User extends Model {
      static entity = 'users'

      static fields () {
        return {
          id: this.attr(null),
          phone: this.hasOne(Phone, 'user_id'),
          posts: this.hasMany(Post, 'user_id')
        }
      }
    }

    class Phone extends Model {
      static entity = 'phones'

      static fields () {
        return {
          id: this.attr(null),
          user_id: this.attr(null)
        }
      }
    }

    class Post extends Model {
      static entity = 'posts'

      static fields () {
        return {
          id: this.attr(null),
          user_id: this.attr(null)
        }
      }
    }

    createStore([{ model: User }, { model: Phone }, { model: Post }])

    await User.create({
      data: {
        id: 1,
        phone: { id: 2, user_id: 1 },
        posts: [
          { id: 3, user_id: 1 },
          { id: 4, user_id: 1 }
        ]
      }
    })

    const user1 = User.query().with('*').first()
    const user2 = User.query().withAll().first()

    expect(user1.phone.id).toBe(2)
    expect(user1.posts[0].id).toBe(3)
    expect(user1.posts[1].id).toBe(4)

    expect(user2.phone.id).toBe(2)
    expect(user2.posts[0].id).toBe(3)
    expect(user2.posts[1].id).toBe(4)
  })

  it('can resolve all relations recursively', async () => {
    class User extends Model {
      static entity = 'users'

      static fields () {
        return {
          id: this.attr(null),
          phone: this.hasOne(Phone, 'user_id'),
          posts: this.hasMany(Post, 'user_id')
        }
      }
    }

    class Phone extends Model {
      static entity = 'phones'

      static fields () {
        return {
          id: this.attr(null),
          user_id: this.attr(null)
        }
      }
    }

    class Post extends Model {
      static entity = 'posts'

      static fields () {
        return {
          id: this.attr(null),
          user_id: this.attr(null),
          user: this.belongsTo(User, 'user_id')
        }
      }
    }

    createStore([{ model: User }, { model: Phone }, { model: Post }])

    await User.create({
      data: {
        id: 1,
        phone: { id: 2, user_id: 1 },
        posts: [
          {
            id: 3,
            user_id: 1,
            user: { id: 1 }
          },
          {
            id: 4,
            user_id: 1,
            user: { id: 1 }
          }
        ]
      }
    })

    const user1 = User.query().withAllRecursive().first()
    const user2 = User.query().withAllRecursive(0).first()

    expect(user1.phone.id).toBe(2)
    expect(user1.posts[0].id).toBe(3)
    expect(user1.posts[0].user.id).toBe(1)
    expect(user1.posts[1].id).toBe(4)
    expect(user1.posts[1].user.id).toBe(1)

    expect(user2.phone.id).toBe(2)
    expect(user2.posts[0].id).toBe(3)
    expect(user2.posts[0].user).toBe(null)
    expect(user2.posts[1].id).toBe(4)
    expect(user2.posts[1].user).toBe(null)
  })

  it('can resolve specified relations recursively', async () => {
    class User extends Model {
      static entity = 'users'

      static fields () {
        return {
          id: this.attr(null),
          comments: this.hasMany(Comment, 'user_id')
        }
      }
    }
    class Comment extends Model {
      static entity = 'posts'

      static fields () {
        return {
          id: this.attr(null),
          comment: this.attr(''),
          user_id: this.attr(null),
          user: this.belongsTo(User, 'user_id'),
          parent_id: this.attr(null),
          children: this.hasMany(Comment, 'parent_id')
        }
      }
    }

    createStore([{ model: User }, { model: Comment }])

    /* await User.create({
      data: {
        id: 1,
        posts: [
          {
            id: 3,
            user_id: 1,
            user: { id: 1 }
          },
          {
            id: 4,
            user_id: 1,
            user: { id: 1 }
          }
        ]
      }
    }) */

    await Comment.create({
      data: {
        id: 0,
        comment: 'Vuex-ORM is pretty great',
        user: { id: 1 },
        children: [
          {
            id: 2,
            comment: 'You got that right!',
            user: { id: 3 }
          },
          {
            id: 4,
            comment: 'And just so easy to use.',
            user: { id: 5 },
            children: [
              {
                id: 6,
                comment: 'You can say that again',
                user: { id: 1 }
              }
            ]
          }
        ]
      }
    })

    const comment1 = Comment.query().withRecursive(['user', 'children']).first()
    const comment2 = Comment.query().withRecursive(['user', 'children', 'comments']).first()
    const comment3 = Comment.query().withRecursive(['user', 'children'], 0).first()

    const user1 = User.query().withRecursive(['comments', 'children']).first()

    // console.log(JSON.parse(JSON.stringify(comment2)))

    expect(comment1.user.id).toBe(1)
    expect(comment1.children[0].id).toBe(2)
    expect(comment1.children[0].user.id).toBe(3)
    expect(comment1.children[0].user.comments).toStrictEqual([])
    expect(comment1.children[1].id).toBe(4)
    expect(comment1.children[1].user.id).toBe(5)
    expect(comment1.children[1].user.comments).toStrictEqual([])
    expect(comment1.children[1].children[0].id).toBe(6)
    expect(comment1.children[1].children[0].user.id).toBe(1)
    expect(comment1.children[1].children[0].user.comments).toStrictEqual([])

    expect(comment2.user.id).toBe(1)
    expect(comment2.user.comments).toHaveLength(2)
    expect(comment2.children[0].id).toBe(2)
    expect(comment2.children[0].user.id).toBe(3)
    expect(comment2.children[0].user.comments).toHaveLength(1)
    expect(comment2.children[1].id).toBe(4)
    expect(comment2.children[1].user.id).toBe(5)
    expect(comment2.children[1].user.comments).toHaveLength(1)
    expect(comment2.children[1].children[0].id).toBe(6)
    expect(comment2.children[1].children[0].user.id).toBe(1)
    expect(comment2.children[1].children[0].user.comments).toHaveLength(2)

    expect(comment3.user.id).toBe(1)
    expect(comment3.children[0].id).toBe(2)
    expect(comment3.children[0].user).toBe(null)
    expect(comment3.children[1].id).toBe(4)
    expect(comment3.children[1].user).toBe(null)
    expect(comment3.children[1].children).toStrictEqual([])

    expect(user1.id).toBe(1)
    expect(user1.comments).toHaveLength(2)
    expect(user1.comments[0].id).toBe(0)
    expect(user1.comments[0].children).toHaveLength(2)
    expect(user1.comments[1].id).toBe(6)
    expect(user1.comments[1].children).toStrictEqual([])
  })

  it('can resolve child relation', () => {
    class User extends Model {
      static entity = 'users'

      static fields () {
        return {
          id: this.attr(null),
          posts: this.hasMany(Post, 'user_id')
        }
      }
    }

    class Post extends Model {
      static entity = 'posts'

      static fields () {
        return {
          id: this.attr(null),
          user_id: this.attr(null),
          comments: this.hasMany(Comment, 'post_id')
        }
      }
    }

    class Comment extends Model {
      static entity = 'comments'

      static fields () {
        return {
          id: this.attr(null),
          post_id: this.attr(null)
        }
      }
    }

    const store = createStore([{ model: User }, { model: Post }, { model: Comment }])

    store.dispatch('entities/users/create', {
      data: {
        id: 1,
        posts: [
          {
            id: 1,
            user_id: 1,
            comments: [
              { id: 1, post_id: 1 },
              { id: 2, post_id: 1 }
            ]
          },
          {
            id: 2,
            user_id: 1,
            comments: [
              { id: 3, post_id: 2 },
              { id: 4, post_id: 2 }
            ]
          }
        ]
      }
    })

    const expected = {
      $id: 1,
      id: 1,
      posts: [
        {
          $id: 1,
          id: 1,
          user_id: 1,
          comments: [
            { $id: 1, id: 1, post_id: 1 },
            { $id: 2, id: 2, post_id: 1 }
          ]
        },
        {
          $id: 2,
          id: 2,
          user_id: 1,
          comments: [
            { $id: 3, id: 3, post_id: 2 },
            { $id: 4, id: 4, post_id: 2 }
          ]
        }
      ]
    }

    const users = store.getters['entities/users/query']().with('posts.comments').find(1)

    expect(users).toEqual(expected)
  })

  it('can resolve even deeper child relation', () => {
    class User extends Model {
      static entity = 'users'

      static fields () {
        return {
          id: this.attr(null),
          posts: this.hasMany(Post, 'user_id')
        }
      }
    }

    class Post extends Model {
      static entity = 'posts'

      static fields () {
        return {
          id: this.attr(null),
          user_id: this.attr(null),
          comments: this.hasMany(Comment, 'post_id')
        }
      }
    }

    class Comment extends Model {
      static entity = 'comments'

      static fields () {
        return {
          id: this.attr(null),
          post_id: this.attr(null),
          likes: this.hasMany(Like, 'comment_id')
        }
      }
    }

    class Like extends Model {
      static entity = 'likes'

      static fields () {
        return {
          id: this.attr(null),
          comment_id: this.attr(null)
        }
      }
    }

    const store = createStore([{ model: User }, { model: Post }, { model: Comment }, { model: Like }])

    store.dispatch('entities/users/create', {
      data: {
        id: 1,
        posts: [
          {
            id: 1,
            user_id: 1,
            comments: [
              { id: 1, post_id: 1, likes: [{ id: 1, comment_id: 1 }] },
              { id: 2, post_id: 1, likes: [{ id: 2, comment_id: 2 }] }
            ]
          },
          {
            id: 2,
            user_id: 1,
            comments: [
              { id: 3, post_id: 2, likes: [{ id: 3, comment_id: 3 }] },
              { id: 4, post_id: 2, likes: [{ id: 4, comment_id: 4 }] }
            ]
          }
        ]
      }
    })

    const expected = {
      $id: 1,
      id: 1,
      posts: [
        {
          $id: 1,
          id: 1,
          user_id: 1,
          comments: [
            { $id: 1, id: 1, post_id: 1, likes: [{ $id: 1, id: 1, comment_id: 1 }] },
            { $id: 2, id: 2, post_id: 1, likes: [{ $id: 2, id: 2, comment_id: 2 }] }
          ]
        },
        {
          $id: 2,
          id: 2,
          user_id: 1,
          comments: [
            { $id: 3, id: 3, post_id: 2, likes: [{ $id: 3, id: 3, comment_id: 3 }] },
            { $id: 4, id: 4, post_id: 2, likes: [{ $id: 4, id: 4, comment_id: 4 }] }
          ]
        }
      ]
    }

    const users = store.getters['entities/users/query']().with('posts.comments.likes').find(1)

    expect(users).toEqual(expected)
  })

  it('can resolve child relations with multiple sub relations with pipe', () => {
    class User extends Model {
      static entity = 'users'

      static fields () {
        return {
          id: this.attr(null),
          posts: this.hasMany(Post, 'user_id')
        }
      }
    }

    class Post extends Model {
      static entity = 'posts'

      static fields () {
        return {
          id: this.attr(null),
          user_id: this.attr(null),
          comments: this.hasMany(Comment, 'post_id'),
          likes: this.hasMany(Like, 'post_id')
        }
      }
    }

    class Comment extends Model {
      static entity = 'comments'

      static fields () {
        return {
          id: this.attr(null),
          post_id: this.attr(null)
        }
      }
    }

    class Like extends Model {
      static entity = 'likes'

      static fields () {
        return {
          id: this.attr(null),
          post_id: this.attr(null)
        }
      }
    }

    const store = createStore([{ model: User }, { model: Post }, { model: Comment }, { model: Like }])

    store.dispatch('entities/users/create', {
      data: {
        id: 1,
        posts: [
          {
            id: 1,
            user_id: 1,
            comments: [
              { id: 1, post_id: 1 },
              { id: 2, post_id: 1 }
            ],
            likes: [
              { id: 1, post_id: 1 },
              { id: 2, post_id: 1 }
            ]
          },
          {
            id: 2,
            user_id: 1,
            comments: [
              { id: 3, post_id: 2 },
              { id: 4, post_id: 2 }
            ],
            likes: [
              { id: 3, post_id: 2 },
              { id: 4, post_id: 2 }
            ]
          }
        ]
      }
    })

    const expected = {
      $id: 1,
      id: 1,
      posts: [
        {
          $id: 1,
          id: 1,
          user_id: 1,
          comments: [
            { $id: 1, id: 1, post_id: 1 },
            { $id: 2, id: 2, post_id: 1 }
          ],
          likes: [
            { $id: 1, id: 1, post_id: 1 },
            { $id: 2, id: 2, post_id: 1 }
          ]
        },
        {
          $id: 2,
          id: 2,
          user_id: 1,
          comments: [
            { $id: 3, id: 3, post_id: 2 },
            { $id: 4, id: 4, post_id: 2 }
          ],
          likes: [
            { $id: 3, id: 3, post_id: 2 },
            { $id: 4, id: 4, post_id: 2 }
          ]
        }
      ]
    }

    const user1 = store.getters['entities/users/query']().with('posts.comments|likes').find(1)
    const user2 = store.getters['entities/users/query']().with('posts.*').find(1)

    expect(user1).toEqual(expected)
    expect(user2).toEqual(expected)
  })

  it('can resolve child relations with multiple sub relations in array', () => {
    class User extends Model {
      static entity = 'users'

      static fields () {
        return {
          id: this.attr(null),
          posts: this.hasMany(Post, 'user_id')
        }
      }
    }

    class Post extends Model {
      static entity = 'posts'

      static fields () {
        return {
          id: this.attr(null),
          user_id: this.attr(null),
          comments: this.hasMany(Comment, 'post_id'),
          likes: this.hasMany(Like, 'post_id')
        }
      }
    }

    class Comment extends Model {
      static entity = 'comments'

      static fields () {
        return {
          id: this.attr(null),
          post_id: this.attr(null)
        }
      }
    }

    class Like extends Model {
      static entity = 'likes'

      static fields () {
        return {
          id: this.attr(null),
          post_id: this.attr(null)
        }
      }
    }

    const store = createStore([{ model: User }, { model: Post }, { model: Comment }, { model: Like }])

    store.dispatch('entities/users/create', {
      data: {
        id: 1,
        posts: [
          {
            id: 1,
            user_id: 1,
            comments: [
              { id: 1, post_id: 1 },
              { id: 2, post_id: 1 }
            ],
            likes: [
              { id: 1, post_id: 1 },
              { id: 2, post_id: 1 }
            ]
          },
          {
            id: 2,
            user_id: 1,
            comments: [
              { id: 3, post_id: 2 },
              { id: 4, post_id: 2 }
            ],
            likes: [
              { id: 3, post_id: 2 },
              { id: 4, post_id: 2 }
            ]
          }
        ]
      }
    })

    const expected = {
      $id: 1,
      id: 1,
      posts: [
        {
          $id: 1,
          id: 1,
          user_id: 1,
          comments: [
            { $id: 1, id: 1, post_id: 1 },
            { $id: 2, id: 2, post_id: 1 }
          ],
          likes: [
            { $id: 1, id: 1, post_id: 1 },
            { $id: 2, id: 2, post_id: 1 }
          ]
        },
        {
          $id: 2,
          id: 2,
          user_id: 1,
          comments: [
            { $id: 3, id: 3, post_id: 2 },
            { $id: 4, id: 4, post_id: 2 }
          ],
          likes: [
            { $id: 3, id: 3, post_id: 2 },
            { $id: 4, id: 4, post_id: 2 }
          ]
        }
      ]
    }

    const user1 = store.getters['entities/users/query']().with(['posts.comments', 'posts.likes']).find(1)
    const user2 = store.getters['entities/users/query']().with(['posts.*']).find(1)

    expect(user1).toEqual(expected)
    expect(user2).toEqual(expected)
  })

  it('ignores any unkown relationship name', async () => {
    class User extends Model {
      static entity = 'users'

      static fields () {
        return {
          id: this.attr(null),
          posts: this.hasMany(Post, 'user_id')
        }
      }
    }

    class Post extends Model {
      static entity = 'posts'

      static fields () {
        return {
          id: this.attr(null),
          user_id: this.attr(null)
        }
      }
    }

    createStore([{ model: User }, { model: Post }])

    await User.create({
      data: {
        id: 1,
        posts: [
          { id: 1, user_id: 1 }
        ]
      }
    })

    const user = User.query().with('unkown').first()

    expect(user.posts.length).toBe(0)
  })

  it('does not retrieve empty relation', async () => {
    class User extends Model {
      static entity = 'users'

      static fields () {
        return {
          id: this.attr(null)
        }
      }
    }

    class Post extends Model {
      static entity = 'posts'

      static fields () {
        return {
          id: this.attr(null),
          user_id: this.attr(null),
          author: this.belongsTo(User, 'user_id')
        }
      }
    }

    createStore([{ model: User }, { model: Post }])

    await User.create({
      data: {
        id: 1
      }
    })
    await Post.create({
      data: {
        id: 1,
        user_id: null
      }
    })

    const post = Post.query()
      .with('*')
      .first()

    expect(post.id).toEqual(1)
    expect(post.user_id).toEqual(null)
    expect(post.author).toEqual(null)
  })
})
