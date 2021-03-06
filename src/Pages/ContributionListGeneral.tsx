import React from 'react'
import { useGetContributeByConditionsQuery } from '../graphql/autogenerate/hooks'
import { Container, Table } from 'reactstrap'
import { useParams } from 'react-router-dom'
import clsx from "clsx"
import { createStyles, lighten, makeStyles, Theme } from "@material-ui/core/styles";
import { TableBody, TableHead, TableRow, TableCell, Checkbox, TableContainer, Typography, Toolbar, Tooltip, TablePagination, CircularProgress, Backdrop  } from "@material-ui/core"
import IconButton from "@material-ui/core/IconButton"
import GetAppIcon from '@material-ui/icons/GetApp'
import { downloadMultiFiles } from '../helper/download-multi-file'


//Define for the header row
interface HeadCell {
    id: keyof Data;
    label: string;
}
const headCells: HeadCell[] = [
    { id: "title", label: "Title" },
    { id: "author", label: "Author" },
    { id: "faculty", label: "Faculty" },
    { id: "status", label: "Status" },
    { id: "selected_by", label: "Update Status by" }
];
//Styling for header
const useToolbarStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            paddingLeft: theme.spacing(2),
            paddingRight: theme.spacing(1)
        },
        highlight:
            theme.palette.type === "light"
                ? {
                    color: theme.palette.secondary.main,
                    backgroundColor: lighten(theme.palette.secondary.light, 0.85)
                }
                : {
                    color: theme.palette.text.primary,
                    backgroundColor: theme.palette.secondary.dark
                },
        title: {
            flex: "100%"
        }
    })
)
interface CustomTableHeaderProps {
    classes: ReturnType<typeof useStyles>;
    numSelected: number;
    onSelectAllClick: (event: React.ChangeEvent<HTMLInputElement>) => void;
    rowCount: number;
}
interface CustomTableHeaderToolbarProps {
    numSelected: number
    setActivity: any
}
const CustomTableHeaderToolbar = (props: CustomTableHeaderToolbarProps) => {
    const classes = useToolbarStyles()
    const { numSelected, setActivity } = props
    return (
        <Toolbar
            className={clsx(classes.root, {
                [classes.highlight]: numSelected > 0
            })}
        >
            {numSelected > 0 ? (
                <Typography
                    className={classes.title}
                    color="inherit"
                    variant="subtitle1"
                    component="div"
                >
                    {numSelected} selected
                </Typography>
            ) : null}
            {numSelected > 0 ? (
                <Tooltip title="Download">
                    <IconButton aria-label="download" onClick={() => setActivity()}>
                        <GetAppIcon />
                    </IconButton>
                </Tooltip>
            ) : null}
        </Toolbar>
    );
}

const CustomTableHeader = (props: CustomTableHeaderProps) => {
    const {
        onSelectAllClick,
        numSelected,
        rowCount,
    } = props;
    return (
        <TableHead>
            <TableRow>
                {/* this is the first column for checkbox */}
                <TableCell padding="checkbox" style={{padding:'0'}}>
                    <Checkbox
                        indeterminate={numSelected > 0 && numSelected < rowCount}
                        checked={rowCount > 0 && numSelected === rowCount}
                        inputProps={{ "aria-label": "select all desserts" }}
                        onChange={onSelectAllClick}
                    />
                </TableCell>
                {headCells.map((headCell) => (
                    <TableCell
                        key={headCell.id}
                        align='left'
                        padding='default'
                        style={{fontWeight:'bold', fontSize:'1.05rem'}}
                    >
                        {headCell.label}
                    </TableCell>
                ))} {/* close headCells.map*/}
            </TableRow>
        </TableHead>
    )
}
//END region define header


//Define the table content rows
interface Data {
    id: string;
    title: string;
    author: string;
    faculty: string;
    status: string;
    selected_by: string;
}
function createData(
    id: string,
    title: string,
    author: string,
    faculty: string,
    status: string,
    selected_by: string,
): Data {
    return { id, title, author, faculty, status, selected_by };
}

const checkStatus = {
    style: function(status: any) {
        console.log('style', status)
        if(status == true) return {color:'#00CA39'}
        else if (status == false) return {color:'#E44067'}
        else if (status == null) return {color:'#878787'}
    },
    label: function(status: any) {
        console.log('label', status)
        if(status == true) return 'ACCEPTED'
        else if (status == false) return 'DENIED'
        else if (status == null) return 'UNKNOW'
    }
}

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            width: "100%",
        },
        table: {
            minWidth: 750
        },
        backdrop: {
            zIndex: theme.zIndex.drawer + 1,
            color: '#fff',
        },
    })
)


//this template apply for ADMIN, MANAGER, MCO
export default function ContributionsPage(){
    const params = useParams();
    const customStyle = useStyles();
    const [selected, setSelected] = React.useState<string[]>([]);
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(5);
    const isSelected = (name: string) => selected.indexOf(name) !== -1;

    // Get data from DB
    const { data, loading, error } = useGetContributeByConditionsQuery({
        fetchPolicy: 'network-only',
        variables: { 
            where: {
                magazine: {
                    id: {
                        _eq: params.idMgz
                    }
                }
            }
        },
    })
    if (loading) return (
        <Backdrop className={customStyle.backdrop} open={loading}>
            <CircularProgress color="inherit"/>
        </Backdrop>
    )
    if (error) return <div> Error at Magazines component {console.log(error)}</div>
    const dataDetail = data && data.contributions
    console.log(dataDetail)
    const rows: any = dataDetail?.map((el:any) => {
        return createData(el.id, el.title, el.userByPublicBy?.fullName, el.user?.faculty?.label, el.isSelected, el.userByPublicBy?.fullName)
    })

    // handle 'select all' button
    const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            const newSelecteds = rows.map((n:any) => n.id)
            setSelected(newSelecteds)
            return
        }
        setSelected([])
    }
    const handleClick = (event: React.MouseEvent<unknown>, id: string) => {
        const selectedIndex = selected.indexOf(id)
        let newSelected: string[] = []
        if (selectedIndex === -1) {
            newSelected = newSelected.concat(selected, id)
        } else if (selectedIndex === 0) {
            newSelected = newSelected.concat(selected.slice(1))
        } else if (selectedIndex === selected.length - 1) {
            newSelected = newSelected.concat(selected.slice(0, -1))
        } else if (selectedIndex > 0) {
            newSelected = newSelected.concat(
                selected.slice(0, selectedIndex),
                selected.slice(selectedIndex + 1)
            )
        }
        setSelected(newSelected);
    }

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    }

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    }
    const getZipFile = async () => {
        const fileInfo = await dataDetail?.map((el:any) => {
            if(selected.indexOf(el.id) > -1) return {info: el.artical.concat(el.image), name: el.title}
        })
        console.log('fileInfo', fileInfo)
        downloadMultiFiles(fileInfo, params.mgzTitle)
        console.log(fileInfo)
    }
    console.log('into contribution List General')


    return (
        <Container>
            <h2 style={{ padding: "20px 0 0 0", clear: 'both' }}>Contribution of {params.mgzTitle}</h2>
            <div className={customStyle.root}>
                <CustomTableHeaderToolbar numSelected={selected.length} setActivity={getZipFile} />
                <TableContainer>
                    <Table
                        className={customStyle.table}
                        aria-labelledby="tableTitle"
                        size="small"
                        aria-label="enhanced table"
                    >
                        <CustomTableHeader
                            onSelectAllClick={handleSelectAllClick}
                            classes={customStyle}
                            numSelected={selected.length}
                            rowCount={(rows) ? rows.length : 0}
                        />
                        <TableBody>
                            {(rows)?rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row: any, index: any) => {
                                const labelId = `enhanced-table-checkbox-${index}`
                                const isItemSelected = isSelected(row.id);
                                return (
                                    <TableRow
                                        role="checkbox"
                                        aria-checked={isItemSelected}
                                        tabIndex={-1}
                                        key={row.id}
                                        selected={isItemSelected}
                                        onClick={(event) => handleClick(event, row.id)}
                                    >
                                        <TableCell padding='checkbox' style={{padding:'0'}}>
                                            <Checkbox checked={isItemSelected} inputProps={{ "aria-labelledby": labelId }} />
                                        </TableCell>
                                        <TableCell component="th" id={labelId} scope="row">
                                            {row.title}
                                        </TableCell>
                                        <TableCell align="left">{row.author}</TableCell>
                                        <TableCell align="left">{row.faculty}</TableCell>
                                        <TableCell align="left" style={checkStatus.style(row.status)}>{checkStatus.label(row.status)}</TableCell>
                                        <TableCell align="left">{row.selected_by}</TableCell>
                                    </TableRow>
                                )
                            }): null}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={(rows) ? rows.length : 0}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onChangePage={handleChangePage}
                    onChangeRowsPerPage={handleChangeRowsPerPage}
                />
            </div>
        </Container>
    )
}
