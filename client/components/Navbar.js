import React from 'react';
import { Link, withRouter } from 'react-router-dom';

// import Drawer from '@material-ui/core/Drawer';

import Toolbar from '@material-ui/core/Toolbar';
import AppBar from '@material-ui/core/AppBar';
import Typography from '@material-ui/core/Typography';
// import Button from '@material-ui/core/Button';
// import IconButton from '@material-ui/core/IconButton';
// import SearchIcon from '@material-ui/icons/Search';
// // import Link from '@material-ui/core/Link';
// import MenuIcon from '@material-ui/icons/Menu';
// import List from '@material-ui/core/List';
// import Divider from '@material-ui/core/Divider';
// import ListItem from '@material-ui/core/ListItem';
// import ListItemIcon from '@material-ui/core/ListItemIcon';
// import ListItemText from '@material-ui/core/ListItemText';
// import Paper from '@material-ui/core/Paper';
// import Tabs from '@material-ui/core/Tabs';
// import Tab from '@material-ui/core/Tab';
import { withStyles, useTheme } from '@material-ui/core/styles';

const useStyles = (theme) => ({
  header: {
    position: 'sticky',
  },
});

const Header = (props) => {
  const { classes } = props;
  return (
    <React.Fragment>
      <AppBar className={classes.header}>
        <Toolbar>
          <Typography variant="h5">
            PBNgen - paint by numbers image generator
          </Typography>
        </Toolbar>
      </AppBar>
    </React.Fragment>
  );
};

export default withRouter(withStyles(useStyles)(Header));
