// 3rd party dependecies
// import toString from 'lodash-es/toString'

// Core dependecies
import config from 'config'
import EventBus from 'core/plugins/event-bus'
import { baseFilterProductsQuery, buildFilterProductsQuery } from '@vue-storefront/store/helpers'

// Core mixins
import Composite from 'core/mixins/composite'

export default {
  name: 'Category',
  mixins: [Composite],
  data () {
    return {
      pagination: {
        perPage: 50,
        current: 0,
        enabled: false
      },
      bottom: false,
      lazyLoadProductsOnscroll: true
    }
  },
  computed: {
    products () {
      return this.$store.state.product.list.items
    },
    productsCounter () {
      return this.$store.state.product.list.items.length
    },
    productsTotal () {
      return this.$store.state.product.list.total
    },
    currentQuery () {
      return this.$store.state.category.current_product_query
    },
    isCategoryEmpty () {
      return (!(this.$store.state.product.list.items) || this.$store.state.product.list.items.length === 0)
    },
    category () {
      return this.$store.state.category.current
    },
    categoryName () {
      return this.$store.state.category.current ? this.$store.state.category.current.name : ''
    },
    categoryId () {
      return this.$store.state.category.current ? this.$store.state.category.current.id : ''
    },
    filters () {
      return this.$store.state.category.filters
    },
    breadcrumbs () {
      return this.$store.state.category.breadcrumbs
    }
  },
  watch: {
    '$route': 'validateRoute',
    bottom (bottom) {
      if (bottom) {
        this.pullMoreProducts()
      }
    }
  },
  preAsyncData ({ store, route }) {
    console.log('preAsyncData query setup')

    store.state.category.current_product_query = {
      populateAggregations: true,
      store: store,
      route: route,
      current: 0,
      perPage: 50,
      filters: config.products.defaultFilters,
      sort: config.entities.productList.sort,
      includeFields: config.entities.optimize && global.$VS.isSSR ? config.entities.productList.includeFields : null,
      excludeFields: config.entities.optimize && global.$VS.isSSR ? config.entities.productList.excludeFields : null,
      append: false
    }
  },
  asyncData ({ store, route }) { // this is for SSR purposes to prefetch data
    return new Promise((resolve, reject) => {
      console.log('Entering asyncData for Category root ' + new Date())
      // this.getURIParams(route.query)
      const defaultFilters = config.products.defaultFilters
      store.dispatch('category/list', { includeFields: config.entities.optimize && global.$VS.isSSR ? config.entities.category.includeFields : null }).then((categories) => {
        store.dispatch('attribute/list', { // load filter attributes for this specific category
          filterValues: defaultFilters, // TODO: assign specific filters/ attribute codes dynamicaly to specific categories
          includeFields: config.entities.optimize && global.$VS.isSSR ? config.entities.attribute.includeFields : null
        }).then((attrs) => {
          store.dispatch('category/single', { key: 'slug', value: route.params.slug }).then((parentCategory) => {
            let query = store.state.category.current_product_query
            let chosen = {}
            Object.keys(route.query).forEach((key) => {
              let filter = route.query[key]
              chosen[key] = {
                attribute_code: key,
                id: filter
              }
            })

            if (!query.searchProductQuery) {
              query = Object.assign(query, { searchProductQuery: baseFilterProductsQuery(parentCategory, defaultFilters) })
            }

            if (Object.keys(chosen).length) {
              let filterQr = buildFilterProductsQuery(parentCategory, chosen, defaultFilters)
              const fsC = Object.assign({}, chosen)
              query = Object.assign(query, {
                searchProductQuery: filterQr,
                configuration: fsC
              })
            }

            store.dispatch('category/products', query).then((subloaders) => {
              Promise.all(subloaders).then((results) => {
                EventBus.$emitFilter('category-after-load', { store: store, route: route }).then((results) => {
                  return resolve()
                }).catch((err) => {
                  console.error(err)
                  return resolve()
                })
              })
            })
          }).catch(err => {
            console.error(err)
            reject(err)
          })
        })
      })
    })
  },
  created () {
    this.$bus.$on('filter-changed-category', this.onFilterChanged)
    if (!global.$VS.isSSR && this.lazyLoadProductsOnscroll) {
      window.addEventListener('scroll', () => {
        this.bottom = this.bottomVisible()
      })
    }
  },
  beforeDestroy () {
    this.$bus.$off('filter-changed-category', this.onFilterChanged)
  },
  methods: {
    bottomVisible () {
      const scrollY = window.scrollY
      const visible = document.documentElement.clientHeight
      const pageHeight = document.documentElement.scrollHeight
      const bottomOfPage = visible + scrollY >= pageHeight
      return bottomOfPage || pageHeight < visible
    },
    pullMoreProducts () {
      let currentQuery = this.currentQuery
      currentQuery.append = true
      currentQuery.route = this.$route
      currentQuery.store = this.$store
      currentQuery.current = currentQuery.current + currentQuery.perPage
      this.pagination.current = currentQuery.current
      this.pagination.perPage = currentQuery.perPage
      if (currentQuery.current <= this.productsTotal) {
        currentQuery.searchProductQuery = buildFilterProductsQuery(this.category, this.filters.chosen)
        return this.$store.dispatch('category/products', currentQuery)
      }
    },
    setURIParams () {
      let params = {}
      Object.values(this.filters.chosen).forEach((filter) => {
        params[filter.attribute_code] = filter.id
      })
      this.$router.replace({query: params})
    },
    getURIParams (query) {
      let filters = {}
      Object.keys(query).forEach((key) => {
        let filter = query[key]
        filters[key] = {
          attribute_code: key,
          id: filter
        }
      })
      return filters
    },
    onFilterChanged (filterOption) {
      // this.pagination.current = 0
      if (this.filters.chosen[filterOption.attribute_code] && ((toString(filterOption.id) === toString(this.filters.chosen[filterOption.attribute_code].id)) || filterOption.id === this.filters.chosen[filterOption.attribute_code].id)) { // for price filter it's a string
        delete this.filters.chosen[filterOption.attribute_code]
      } else {
        this.filters.chosen[filterOption.attribute_code] = filterOption
      }
      this.setURIParams()
    },
    validateRoute () {
      let self = this
      let store = self.$store
      let route = self.$route
      // this.getURIParams(route.query)

      let slug = route.params.slug
      if (!route.query) {
        this.filters.chosen = {} // reset selected filters
        this.$bus.$emit('filter-reset')
      }
      store.dispatch('category/single', { key: 'slug', value: slug }).then((category) => {
        if (!category) {
          self.$router.push('/')
        } else {
          this.pagination.current = 0
          let searchProductQuery = baseFilterProductsQuery(store.state.category.current, config.products.defaultFilters)
          self.$bus.$emit('current-category-changed', store.state.category.current_path)
          let query = store.state.category.current_product_query
          let filterQr = buildFilterProductsQuery(this.category, this.filters.chosen)
          const fsC = Object.assign({}, this.filters.chosen)
          query = Object.assign(query, { // base prototype from the asyncData is being used here
            current: self.pagination.current,
            populateAggregations: false,
            searchProductQuery: filterQr,
            perPage: self.pagination.perPage,
            configuration: fsC,
            store: this.$store,
            route: this.$route,
            append: false
          })
          if (!query.searchProductQuery) {
            query.searchProductQuery = searchProductQuery
          }
          self.$store.dispatch('category/products', store.state.category.current_product_query)
          EventBus.$emitFilter('category-after-load', { store: store, route: route })
        }
      })
    }
  },
  metaInfo () {
    return {
      title: this.$route.meta.title || this.categoryName,
      meta: this.$route.meta.description ? [{ vmid: 'description', description: this.$route.meta.description }] : []
    }
  }
}
