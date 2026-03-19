import React from 'react'
import { Icon, Pagination } from 'semantic-ui-react'

export default function Paginador({paginate,page,lastPage}) {
  return (
    <>
    
    <Pagination
            activePage={page}
            totalPages={lastPage}
            ellipsisItem={{
              content: <Icon name="ellipsis horizontal" />,
              icon: true,
            }}
            firstItem={{
              content: <Icon name="angle double left" />,
              icon: true,
            }}
            lastItem={{
              content: <Icon name="angle double right" />,
              icon: true,
            }}
            prevItem={{ content: <Icon name="angle left" />, icon: true }}
            nextItem={{ content: <Icon name="angle right" />, icon: true }}
            onPageChange={(event, data) => paginate(data.activePage)}
          />
    </>
  )
}
